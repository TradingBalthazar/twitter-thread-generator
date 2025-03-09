import { NextApiRequest, NextApiResponse } from 'next';
import { getRecentProcessedTweets } from '@/lib/twitter/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tweets = await getRecentProcessedTweets();
    
    // Even if there's an error in getRecentProcessedTweets, it will return an empty array
    // rather than throwing an error, so we'll always have a valid response
    return res.status(200).json({
      tweets,
      count: tweets.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in dashboard API:', error);
    // Return an empty array instead of an error
    return res.status(200).json({
      tweets: [],
      count: 0,
      error: 'Failed to fetch tweets, but returning empty array to prevent UI errors',
      timestamp: new Date().toISOString()
    });
  }
}