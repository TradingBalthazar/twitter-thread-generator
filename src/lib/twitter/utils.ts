import { redis } from '@/lib/redis';
import { ProcessedTweet } from './types';

/**
 * Get the last processed tweet ID for a specific account
 */
export async function getLastProcessedId(accountName: string): Promise<string | null> {
  return redis.get(`lastProcessedId:${accountName}`);
}

/**
 * Set the last processed tweet ID for a specific account
 */
export async function setLastProcessedId(accountName: string, tweetId: string): Promise<void> {
  await redis.set(`lastProcessedId:${accountName}`, tweetId);
}

/**
 * Check if a tweet has already been processed
 */
export async function isTweetProcessed(tweetId: string): Promise<boolean> {
  const processed = await redis.get(`tweet:${tweetId}`);
  return !!processed;
}

/**
 * Store a processed tweet
 */
export async function storeProcessedTweet(tweet: ProcessedTweet): Promise<void> {
  await redis.set(`tweet:${tweet.id}`, JSON.stringify(tweet));
}

/**
 * Get a processed tweet by ID
 */
export async function getProcessedTweet(tweetId: string): Promise<ProcessedTweet | null> {
  const tweet = await redis.get(`tweet:${tweetId}`);
  return tweet ? JSON.parse(tweet as string) : null;
}

/**
 * Get all processed tweets (limited to the most recent 100)
 */
export async function getRecentProcessedTweets(): Promise<ProcessedTweet[]> {
  try {
    // This is a simplified implementation and might not be efficient for production
    // In a real-world scenario, you might want to use a different data structure
    const keys = await redis.keys('tweet:*');
    
    // If no tweets found, return empty array
    if (!keys || keys.length === 0) {
      console.log('No tweets found in database');
      return [];
    }
    
    const tweets: ProcessedTweet[] = [];
    
    // Limit to the most recent 100 tweets
    const recentKeys = keys.slice(0, 100);
    
    for (const key of recentKeys) {
      try {
        const tweet = await redis.get(key);
        if (tweet) {
          // Handle the case where the tweet is stored as "[object Object]"
          if (tweet === "[object Object]") {
            console.error(`Invalid tweet data found for key ${key}: ${tweet}`);
            // Delete the corrupted data
            await redis.del(key);
          } else {
            tweets.push(JSON.parse(tweet as string));
          }
        }
      } catch (error) {
        console.error(`Error parsing tweet from key ${key}:`, error);
        // Delete the corrupted data
        await redis.del(key);
        // Continue with other tweets even if one fails
      }
    }
    
    // Sort by processedAt in descending order (most recent first)
    return tweets.sort((a, b) => b.processedAt - a.processedAt);
  } catch (error) {
    console.error('Error fetching recent processed tweets:', error);
    // Return empty array instead of throwing error
    return [];
  }
}