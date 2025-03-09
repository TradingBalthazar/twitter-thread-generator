import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@/lib/redis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all tweet keys
    const keys = await redis.keys('tweet:*');
    console.log(`Found ${keys.length} tweet keys`);
    
    let cleanedCount = 0;
    let corruptedCount = 0;
    
    // Check each tweet for corruption
    for (const key of keys) {
      try {
        const tweetData = await redis.get(key);
        
        if (!tweetData) {
          console.log(`No data found for key ${key}`);
          continue;
        }
        
        // Check if the data is corrupted
        if (tweetData === "[object Object]") {
          console.log(`Corrupted data found for key ${key}: ${tweetData}`);
          await redis.del(key);
          corruptedCount++;
        } else {
          // Try to parse it to make sure it's valid JSON
          try {
            JSON.parse(tweetData as string);
            cleanedCount++;
          } catch (parseError) {
            console.error(`Invalid JSON for key ${key}: ${tweetData}`);
            await redis.del(key);
            corruptedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing key ${key}:`, error);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Cleaned up tweet data: ${cleanedCount} valid tweets, ${corruptedCount} corrupted tweets removed`,
      cleanedCount,
      corruptedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error cleaning up tweet data:', error);
    return res.status(500).json({ 
      error: 'Failed to clean up tweet data',
      details: error 
    });
  }
}