import { NextApiRequest, NextApiResponse } from 'next';
import { config } from '@/config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Return basic information about the environment
    return res.status(200).json({
      success: true,
      message: 'Test endpoint is working',
      environment: {
        openrouterModel: config.openrouter.model,
        openrouterApiKeySet: !!process.env.OPENROUTER_API_KEY,
        giphyApiKeySet: !!process.env.GIPHY_API_KEY,
        twitterApiKeySet: !!process.env.TWITTER_API_KEY,
        accountsToMonitor: config.twitter.accountsToMonitor,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({ error: 'Test endpoint failed', details: error });
  }
}
