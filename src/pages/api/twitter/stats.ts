import { NextApiRequest, NextApiResponse } from 'next';
import { getRecentProcessedTweets } from '@/lib/twitter/utils';
import { ProcessedTweet } from '@/lib/twitter/types';

interface TweetStats {
  totalTweets: number;
  totalReplied: number;
  totalFailed: number;
  byAccount: Record<string, {
    tweets: number;
    replied: number;
    failed: number;
  }>;
  lastProcessed: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tweets = await getRecentProcessedTweets();
    
    // Calculate statistics
    const stats: TweetStats = {
      totalTweets: tweets.length,
      totalReplied: tweets.filter(t => t.replied).length,
      totalFailed: tweets.filter(t => !t.replied).length,
      byAccount: {},
      lastProcessed: tweets.length > 0 
        ? new Date(Math.max(...tweets.map(t => t.processedAt))).toISOString()
        : null
    };
    
    // Calculate per-account statistics
    tweets.forEach(tweet => {
      if (!stats.byAccount[tweet.authorUsername]) {
        stats.byAccount[tweet.authorUsername] = {
          tweets: 0,
          replied: 0,
          failed: 0
        };
      }
      
      stats.byAccount[tweet.authorUsername].tweets++;
      
      if (tweet.replied) {
        stats.byAccount[tweet.authorUsername].replied++;
      } else {
        stats.byAccount[tweet.authorUsername].failed++;
      }
    });
    
    return res.status(200).json({ stats });
  } catch (error) {
    console.error('Error calculating tweet statistics:', error);
    return res.status(200).json({ 
      stats: {
        totalTweets: 0,
        totalReplied: 0,
        totalFailed: 0,
        byAccount: {},
        lastProcessed: null
      },
      error: 'Failed to calculate statistics'
    });
  }
}