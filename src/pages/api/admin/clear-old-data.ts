import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@/lib/redis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This is an admin endpoint, so we'll add a simple security check
  // In a production environment, you'd want more robust authentication
  const adminKey = req.query.key;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting data cleanup...');
    
    // Get all tweet keys
    const tweetKeys = await redis.keys('tweet:*');
    console.log(`Found ${tweetKeys.length} total tweets in database`);
    
    let removedCount = 0;
    
    // Process each tweet
    for (const key of tweetKeys) {
      const tweet = await redis.get(key);
      if (tweet) {
        const tweetData = JSON.parse(tweet as string);
        
        // If the tweet is not from WatcherGuru, delete it
        if (tweetData.authorUsername !== 'WatcherGuru') {
          await redis.del(key);
          removedCount++;
          console.log(`Deleted ${key} from ${tweetData.authorUsername}`);
        }
      }
    }
    
    // Clear last processed IDs for accounts other than WatcherGuru
    const lastProcessedKeys = await redis.keys('lastProcessedId:*');
    for (const key of lastProcessedKeys) {
      if (!key.includes('lastProcessedId:WatcherGuru')) {
        await redis.del(key);
        console.log(`Deleted ${key}`);
      }
    }
    
    // Reset total impressions counter
    await redis.del('total_impressions');
    console.log('Reset total impressions counter');
    
    return res.status(200).json({
      success: true,
      message: 'Data cleanup complete',
      removedTweets: removedCount,
      keptAccount: 'WatcherGuru'
    });
  } catch (error) {
    console.error('Error clearing old data:', error);
    return res.status(500).json({ error: 'Failed to clear old data', details: error });
  }
}