/**
 * This script clears data from previously monitored accounts while keeping data for WatcherGuru.
 * 
 * Usage:
 * 1. Run: npx ts-node --project tsconfig.json src/scripts/clear-old-data.ts
 */

import { redis } from '../lib/redis';
import { getRecentProcessedTweets } from '../lib/twitter/utils';

async function clearOldData() {
  try {
    console.log('Starting data cleanup...');
    
    // Get all processed tweets
    const tweets = await getRecentProcessedTweets();
    console.log(`Found ${tweets.length} total tweets in database`);
    
    // Filter tweets from accounts other than WatcherGuru
    const tweetsToRemove = tweets.filter(tweet => tweet.authorUsername !== 'WatcherGuru');
    console.log(`Found ${tweetsToRemove.length} tweets to remove from accounts other than WatcherGuru`);
    
    // Delete each tweet
    for (const tweet of tweetsToRemove) {
      await redis.del(`tweet:${tweet.id}`);
      console.log(`Deleted tweet:${tweet.id} from ${tweet.authorUsername}`);
    }
    
    // Clear last processed IDs for accounts other than WatcherGuru
    const keys = await redis.keys('lastProcessedId:*');
    for (const key of keys) {
      if (!key.includes('lastProcessedId:WatcherGuru')) {
        await redis.del(key);
        console.log(`Deleted ${key}`);
      }
    }
    
    // Reset total impressions counter
    await redis.del('total_impressions');
    console.log('Reset total impressions counter');
    
    console.log('Data cleanup complete!');
    console.log(`Kept data for WatcherGuru, removed data for all other accounts.`);
  } catch (error) {
    console.error('Error clearing old data:', error);
  }
}

// Run the function
clearOldData().then(() => process.exit(0));