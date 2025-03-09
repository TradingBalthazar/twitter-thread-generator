import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@/lib/redis';
import { config } from '@/config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Delete the last processed ID for MarioNawfal
    await redis.del(`lastProcessedId:${config.twitter.accountToMonitor}`);
    
    console.log(`Reset last processed ID for @${config.twitter.accountToMonitor}`);
    
    return res.status(200).json({
      success: true,
      message: `Reset last processed ID for @${config.twitter.accountToMonitor}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting last processed ID:', error);
    return res.status(500).json({ 
      error: 'Failed to reset last processed ID',
      details: error 
    });
  }
}