import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@/lib/redis';
import { rwClient } from '@/lib/twitter/client';
import { generateStatisticalReply, generateImageForFact } from '@/lib/openrouter/client';
import { config } from '@/config';
import { ProcessedTweet } from '@/lib/twitter/types';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Monitor API called with method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers));
  
  // For cron jobs, accept any method (GET, POST, etc.)
  // Only require POST for manual invocations from the dashboard
  const isCronJob = req.headers['x-vercel-cron'] ||
                   req.headers['x-zeit-cron'] ||
                   req.headers['x-vercel-id']?.toString().includes('cron') ||
                   req.query.cron === 'true';
  
  if (req.method !== 'POST' && !isCronJob) {
    console.log('Method not allowed, returning 405');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting content generation process');
    console.log(`Monitoring @${config.twitter.accountToMonitor} for inspiration`);
    console.log('OpenRouter model:', config.openrouter.model);
    console.log('OPENROUTER_API_KEY set:', !!process.env.OPENROUTER_API_KEY);
    
    const results: ProcessedTweet[] = [];
    
    // Get authenticated user ID
    const me = await rwClient.v2.me();
    const myUserId = me.data.id;
    console.log(`Authenticated as user ID: ${myUserId}`);
    
    // Get user ID from username
    const userLookup = await rwClient.v2.userByUsername(config.twitter.accountToMonitor);
    if (!userLookup.data) {
      console.error(`Could not find user: ${config.twitter.accountToMonitor}`);
      return res.status(404).json({
        error: `User ${config.twitter.accountToMonitor} not found`,
        timestamp: new Date().toISOString()
      });
    }
    
    const userId = userLookup.data.id;
    console.log(`Found user ID for @${config.twitter.accountToMonitor}: ${userId}`);
    
    // Get the last processed tweet ID
    const lastProcessedId = await redis.get(`lastProcessedId:${config.twitter.accountToMonitor}`);
    console.log(`Last processed ID for @${config.twitter.accountToMonitor}: ${lastProcessedId || 'None'}`);
    
    // Fetch recent tweets from this account
    const userTimeline = await rwClient.v2.userTimeline(userId, {
      max_results: 5, // We only need a few recent tweets
      ...(lastProcessedId ? { since_id: lastProcessedId as string } : {}),
      "tweet.fields": ["created_at", "text"],
      exclude: ["retweets", "replies"] // Only get original tweets
    });
    
    if (!userTimeline.data || userTimeline.data.meta.result_count === 0) {
      console.log(`No new tweets found for @${config.twitter.accountToMonitor}`);
      return res.status(200).json({
        success: true,
        processed: 0,
        results: []
      });
    }
    
    console.log(`Found ${userTimeline.data.meta.result_count} new tweets for @${config.twitter.accountToMonitor}`);
    
    // Get the newest tweet ID
    let newestId = lastProcessedId as string;
    
    // Process each new tweet
    for (const tweet of userTimeline.data.data) {
      // Update newest ID
      if (!newestId || tweet.id > newestId) {
        newestId = tweet.id;
      }
      
      // Check if we've already processed this tweet
      const processed = await redis.get(`tweet:${tweet.id}`);
      if (processed) {
        console.log(`Tweet ${tweet.id} already processed, skipping`);
        continue;
      }
      
      console.log(`Using tweet for inspiration: ${tweet.id} by @${config.twitter.accountToMonitor}`);
      console.log(`Inspiration tweet text: ${tweet.text}`);
      
      try {
        // Generate a statistical post using OpenRouter, inspired by the tweet
        const statisticalPost = await generateStatisticalReply(tweet.text, config.twitter.accountToMonitor);
        console.log(`Generated statistical post: ${statisticalPost}`);
        
        // Generate an image for the statistical post
        console.log(`Generating image for the statistical post...`);
        const imageUrl = await generateImageForFact(statisticalPost);
        
        let tweetId;
        
        if (imageUrl) {
          console.log(`Successfully generated image: ${imageUrl}`);
          
          try {
            // Download the image
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(imageResponse.data);
            
            // Upload the image to Twitter
            const mediaId = await rwClient.v1.uploadMedia(imageBuffer, {
              mimeType: imageResponse.headers['content-type'] || 'image/png'
            });
            console.log(`Uploaded image to Twitter, media ID: ${mediaId}`);
            
            // Post tweet with the image
            const tweetResult = await rwClient.v2.tweet({
              text: statisticalPost,
              media: {
                media_ids: [mediaId]
              }
            });
            
            tweetId = tweetResult.data.id;
            console.log(`Posted original tweet with image: ${tweetId}`);
          } catch (imageError) {
            console.error('Error posting tweet with image:', imageError);
            
            // Fallback to posting without image
            const tweetResult = await rwClient.v2.tweet(statisticalPost);
            tweetId = tweetResult.data.id;
            console.log(`Posted original tweet without image (fallback): ${tweetId}`);
          }
        } else {
          // Post without image if image generation failed
          const tweetResult = await rwClient.v2.tweet(statisticalPost);
          tweetId = tweetResult.data.id;
          console.log(`Posted original tweet without image: ${tweetId}`);
        }
        
        // Store the processed tweet
        const processedTweet: ProcessedTweet = {
          id: tweet.id, // Store Mario's tweet ID for reference
          text: tweet.text, // Store Mario's tweet text for reference
          authorUsername: config.twitter.accountToMonitor,
          processedAt: Date.now(),
          replied: false, // Not a reply
          replyText: statisticalPost, // Store our post for reference
          replyId: tweetId, // Store our tweet ID
          impressions: 0, // Initialize with 0, will be updated later
        };
        
        await redis.set(`tweet:${tweet.id}`, JSON.stringify(processedTweet));
        results.push(processedTweet);
      } catch (error) {
        console.error(`Error processing tweet ${tweet.id}:`, error);
      }
    }
    
    // Update the last processed ID
    if (newestId && newestId !== lastProcessedId) {
      await redis.set(`lastProcessedId:${config.twitter.accountToMonitor}`, newestId);
      console.log(`Updated last processed ID for @${config.twitter.accountToMonitor} to ${newestId}`);
    }
    
    return res.status(200).json({
      success: true,
      processed: results.length,
      results
    });
  } catch (error) {
    console.error('Error generating content from inspiration tweets:', error);
    // Convert error to a more detailed format for debugging
    let errorDetails;
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else {
      errorDetails = String(error);
    }
    
    return res.status(500).json({
      error: 'Failed to generate content from inspiration tweets',
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
}