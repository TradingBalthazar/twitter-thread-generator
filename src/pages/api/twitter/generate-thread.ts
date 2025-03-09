import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@/lib/redis';
import { generateTwitterThread } from '@/lib/openrouter/client';

// Define the structure for a thread post
interface ThreadPost {
  text: string;
  position: number;
  category: string;
}

// Define the structure for a complete thread
interface Thread {
  username: string;
  posts: ThreadPost[];
  generatedAt: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    console.log(`Generating thread for @${username}`);

    // Check if we already have a generated thread for this user
    const existingThread = await redis.get(`thread:${username}`);
    
    if (existingThread) {
      console.log(`Found existing thread for @${username}`);
      return res.status(200).json({
        success: true,
        thread: JSON.parse(existingThread as string),
        isNew: false
      });
    }

    // Check if we have historical tweets for this user
    const tweetsCount = await redis.get(`historicalTweetsCount:${username}`);
    
    if (!tweetsCount || Number(tweetsCount) === 0) {
      return res.status(400).json({
        error: `No historical tweets found for @${username}. Please fetch historical tweets first.`
      });
    }

    // Get the list of tweet IDs for this user
    const tweetIdsJson = await redis.get(`historicalTweetIds:${username}`);
    
    if (!tweetIdsJson) {
      return res.status(400).json({
        error: `No tweet IDs found for @${username}. Please fetch historical tweets first.`
      });
    }

    const tweetIds = JSON.parse(tweetIdsJson as string);
    console.log(`Found ${tweetIds.length} tweet IDs for @${username}`);

    // Fetch a sample of tweets to analyze (we don't need all 1500 for analysis)
    // We'll take tweets at regular intervals to get a good representation over time
    const sampleSize = Math.min(100, tweetIds.length);
    const step = Math.max(1, Math.floor(tweetIds.length / sampleSize));
    
    const sampleTweets = [];
    for (let i = 0; i < tweetIds.length; i += step) {
      const tweetId = tweetIds[i];
      const tweetJson = await redis.get(`historicalTweet:${username}:${tweetId}`);
      
      if (tweetJson) {
        sampleTweets.push(JSON.parse(tweetJson as string));
      }
      
      if (sampleTweets.length >= sampleSize) break;
    }

    console.log(`Analyzing ${sampleTweets.length} sample tweets for @${username} using OpenRouter`);

    // Use OpenRouter to generate the thread
    const threadPosts = await generateTwitterThread(username, sampleTweets);
    
    // Create the thread object
    const thread: Thread = {
      username,
      posts: threadPosts,
      generatedAt: Date.now()
    };

    // Store the generated thread
    await redis.set(`thread:${username}`, JSON.stringify(thread));

    return res.status(200).json({
      success: true,
      thread,
      isNew: true
    });
  } catch (error) {
    console.error('Error generating thread:', error);
    
    let errorDetails;
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else {
      errorDetails = String(error);
    }
    
    return res.status(500).json({
      error: 'Failed to generate thread',
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
}