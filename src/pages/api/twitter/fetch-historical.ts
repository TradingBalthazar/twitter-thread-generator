import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@/lib/redis';
import { rwClient } from '@/lib/twitter/client';
import { ProcessedTweet } from '@/lib/twitter/types';

// Define a new interface for historical tweets with additional metadata
interface HistoricalTweet extends ProcessedTweet {
  createdAt: string;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  quoteCount?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    console.log(`Fetching historical tweets for @${username}`);

    // Check if we already have tweets for this user in the database
    const existingTweetsCount = await redis.get(`historicalTweetsCount:${username}`);
    
    if (existingTweetsCount && Number(existingTweetsCount) > 0) {
      console.log(`Found ${existingTweetsCount} existing historical tweets for @${username}`);
      return res.status(200).json({
        success: true,
        message: `Already fetched ${existingTweetsCount} tweets for @${username}`,
        count: Number(existingTweetsCount)
      });
    }

    // Get user ID from username
    const userLookup = await rwClient.v2.userByUsername(username);
    if (!userLookup.data) {
      console.error(`Could not find user: ${username}`);
      return res.status(404).json({
        error: `User ${username} not found`,
        timestamp: new Date().toISOString()
      });
    }

    const userId = userLookup.data.id;
    console.log(`Found user ID for @${username}: ${userId}`);

    // Initialize variables for pagination
    let paginationToken: string | undefined = undefined;
    let totalTweets = 0;
    const maxTweets = 1500; // Twitter API limit for historical data
    const batchSize = 100; // Maximum per request
    const allTweets: HistoricalTweet[] = [];
    
    // Twitter API v2 rate limit is 1500 tweets per user timeline
    // and 15 requests per 15 minutes for this endpoint (180 requests per hour)
    // We'll need to make multiple requests with pagination to get all tweets
    while (totalTweets < maxTweets) {
      console.log(`Fetching batch of tweets for @${username}, current total: ${totalTweets}`);
      
      try {
        // Use a more robust approach with error handling
        const userTimeline = await rwClient.v2.userTimeline(userId, {
          max_results: batchSize,
          pagination_token: paginationToken,
          "tweet.fields": [
            "created_at",
            "public_metrics",
            "text"
          ],
          exclude: ["retweets", "replies"] // Only get original tweets
        });
        
        if (!userTimeline.data || userTimeline.data.meta.result_count === 0) {
          console.log(`No more tweets found for @${username}`);
          break;
        }
        
        // Process tweets in this batch
        for (const tweet of userTimeline.data.data) {
          const historicalTweet: HistoricalTweet = {
            id: tweet.id,
            text: tweet.text,
            authorUsername: username,
            processedAt: Date.now(),
            replied: false,
            createdAt: tweet.created_at || new Date().toISOString(),
            likeCount: tweet.public_metrics?.like_count,
            retweetCount: tweet.public_metrics?.retweet_count,
            replyCount: tweet.public_metrics?.reply_count,
            quoteCount: tweet.public_metrics?.quote_count
          };
          
          allTweets.push(historicalTweet);
          
          // Store each tweet in Redis
          await redis.set(`historicalTweet:${username}:${tweet.id}`, JSON.stringify(historicalTweet));
        }
        
        totalTweets += userTimeline.data.meta.result_count;
        console.log(`Fetched ${userTimeline.data.meta.result_count} tweets, total now: ${totalTweets}`);
        
        // Check if there are more tweets to fetch
        if (!userTimeline.data.meta.next_token) {
          console.log(`No more pagination tokens, ending fetch for @${username}`);
          break;
        }
        
        paginationToken = userTimeline.data.meta.next_token;
        
        // Add a small delay to avoid hitting rate limits too quickly
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching tweets batch for @${username}:`, error);
        
        // Check for specific Twitter API errors
        if (typeof error === 'object' && error !== null) {
          // Rate limit error
          if ('code' in error && (error.code === 429 || error.code === 88)) {
            console.error('Twitter API rate limit exceeded. Waiting before retrying...');
            // Store what we have so far
            if (totalTweets > 0) {
              await redis.set(`historicalTweetsCount:${username}`, totalTweets.toString());
              const tweetIds = allTweets.map(tweet => tweet.id);
              await redis.set(`historicalTweetIds:${username}`, JSON.stringify(tweetIds));
            }
            
            return res.status(429).json({
              error: 'Twitter API rate limit exceeded',
              message: 'Partial data has been stored. Try again later to fetch more tweets.',
              count: totalTweets,
              timestamp: new Date().toISOString()
            });
          }
          
          // Authentication error
          if ('code' in error && (error.code === 401 || error.code === 403)) {
            console.error('Twitter API authentication error. Check your API credentials.');
            return res.status(401).json({
              error: 'Twitter API authentication error',
              message: 'Please check your Twitter API credentials.',
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // For other errors, we'll break and return what we have so far
        break;
      }
    }
    
    // Store the total count
    await redis.set(`historicalTweetsCount:${username}`, totalTweets.toString());
    
    // Store the list of tweet IDs for this user
    const tweetIds = allTweets.map(tweet => tweet.id);
    await redis.set(`historicalTweetIds:${username}`, JSON.stringify(tweetIds));
    
    return res.status(200).json({
      success: true,
      message: `Successfully fetched ${totalTweets} historical tweets for @${username}`,
      count: totalTweets
    });
  } catch (error) {
    console.error('Error fetching historical tweets:', error);
    
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
      error: 'Failed to fetch historical tweets',
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
}