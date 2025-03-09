import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@/lib/redis';
import { rwClient } from '@/lib/twitter/client';
import { ProcessedTweet } from '@/lib/twitter/types';
import { getRecentProcessedTweets } from '@/lib/twitter/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Update impressions API called with method:', req.method);
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
    // Get all processed tweets
    const tweets = await getRecentProcessedTweets();
    
    // Filter tweets that have a reply ID
    const tweetsWithReplies = tweets.filter(tweet => tweet.replied && tweet.replyId);
    
    console.log(`Found ${tweetsWithReplies.length} tweets with replies to update impressions`);
    
    // Sort by processedAt to prioritize newer tweets
    tweetsWithReplies.sort((a, b) => b.processedAt - a.processedAt);
    
    // Limit to 10 tweets per run to avoid rate limits
    // Twitter has a 24-hour limit of 100 requests for certain endpoints
    const tweetsToUpdate = tweetsWithReplies.slice(0, 10);
    console.log(`Processing ${tweetsToUpdate.length} tweets in this run (rate limit protection)`);
    
    let updatedCount = 0;
    let totalImpressions = 0;
    
    // Update impressions for each tweet
    for (const tweet of tweetsToUpdate) {
      if (!tweet.replyId) continue;
      
      try {
        // Fetch the tweet to get impression count
        const tweetData = await rwClient.v2.singleTweet(tweet.replyId, {
          "tweet.fields": ["public_metrics", "non_public_metrics"]
        });
        
        // Check if we have access to impression data
        // Note: This requires elevated access to the Twitter API
        const impressions = tweetData.data.non_public_metrics?.impression_count || 
                           tweetData.data.public_metrics?.impression_count || 0;
        
        console.log(`Tweet ${tweet.replyId} has ${impressions} impressions`);
        
        // Update the tweet with impression data
        tweet.impressions = impressions;
        totalImpressions += impressions;
        
        // Save the updated tweet
        await redis.set(`tweet:${tweet.id}`, JSON.stringify(tweet));
        updatedCount++;
      } catch (error) {
        console.error(`Error updating impressions for tweet ${tweet.replyId}:`, error);
      }
    }
    
    // Also store the total impressions as a separate key for easy access
    await redis.set('total_impressions', totalImpressions);
    
    return res.status(200).json({
      success: true,
      updatedCount,
      totalImpressions
    });
  } catch (error) {
    console.error('Error updating impressions:', error);
    
    // Check if it's a rate limit error
    if (error.code === 429) {
      console.error('Rate limit exceeded. Will retry on next scheduled run.');
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Twitter API rate limit reached. Will retry on next scheduled run.',
        details: error
      });
    }
    
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
      error: 'Failed to update impressions',
      details: errorDetails
    });
  }
}