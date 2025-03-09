import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@/lib/redis';
import { getRecentProcessedTweets } from '@/lib/twitter/utils';
import { ProcessedTweet } from '@/lib/twitter/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to get the cached total impressions first
    let totalImpressions = await redis.get('total_impressions');
    
    // If not available, calculate from tweets
    if (totalImpressions === null) {
      const tweets = await getRecentProcessedTweets();
      totalImpressions = tweets.reduce((total, tweet) => total + (tweet.impressions || 0), 0);
      
      // Cache the result
      await redis.set('total_impressions', totalImpressions);
    }
    
    // Get total tweet count
    const tweets = await getRecentProcessedTweets();
    const totalTweets = tweets.length;
    const repliedTweets = tweets.filter(t => t.replied).length;
    
    // Get counts by account
    const accountCounts: Record<string, number> = {};
    tweets.forEach(tweet => {
      if (!accountCounts[tweet.authorUsername]) {
        accountCounts[tweet.authorUsername] = 0;
      }
      accountCounts[tweet.authorUsername]++;
    });
    
    return res.status(200).json({
      totalImpressions: Number(totalImpressions),
      totalTweets,
      repliedTweets,
      accountCounts,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching impression data:', error);
    return res.status(200).json({
      totalImpressions: 0,
      totalTweets: 0,
      repliedTweets: 0,
      accountCounts: {},
      error: 'Failed to fetch impression data',
      lastUpdated: new Date().toISOString()
    });
  }
}