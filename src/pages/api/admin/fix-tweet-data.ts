import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@/lib/redis';
import { ProcessedTweet } from '@/lib/twitter/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This is an admin endpoint, so we'll add a simple security check
  // In a production environment, you'd want more robust authentication
  const adminKey = req.query.key;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting tweet data fix...');
    
    // Get all tweet keys
    const keys = await redis.keys('tweet:*');
    console.log(`Found ${keys.length} total tweets in database`);
    
    let fixedCount = 0;
    let deletedCount = 0;
    let validCount = 0;
    
    // Process each tweet
    for (const key of keys) {
      try {
        const tweetData = await redis.get(key);
        
        if (!tweetData) {
          console.log(`Empty data for key ${key}, deleting...`);
          await redis.del(key);
          deletedCount++;
          continue;
        }
        
        // Try to parse the JSON
        try {
          JSON.parse(tweetData as string);
          validCount++;
        } catch (parseError) {
          console.error(`Invalid JSON for key ${key}: ${tweetData}`);
          
          // If it's an object but not valid JSON, it might be a stringified object
          if (tweetData.toString().startsWith('[object Object]')) {
            console.log(`Deleting corrupted data for key ${key}`);
            await redis.del(key);
            deletedCount++;
          } else {
            // Try to fix common JSON issues
            try {
              // Replace single quotes with double quotes
              let fixedData = tweetData.toString().replace(/'/g, '"');
              // Ensure property names are quoted
              fixedData = fixedData.replace(/(\w+):/g, '"$1":');
              
              // Try to parse the fixed data
              JSON.parse(fixedData);
              
              // If we get here, the fix worked
              console.log(`Fixed JSON for key ${key}`);
              await redis.set(key, fixedData);
              fixedCount++;
            } catch (fixError) {
              // If we can't fix it, delete it
              console.log(`Could not fix data for key ${key}, deleting...`);
              await redis.del(key);
              deletedCount++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing key ${key}:`, error);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Tweet data fix complete',
      stats: {
        validTweets: validCount,
        fixedTweets: fixedCount,
        deletedTweets: deletedCount,
        totalProcessed: validCount + fixedCount + deletedCount
      }
    });
  } catch (error) {
    console.error('Error fixing tweet data:', error);
    return res.status(500).json({ error: 'Failed to fix tweet data', details: error });
  }
}