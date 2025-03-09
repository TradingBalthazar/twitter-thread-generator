import { TwitterApi } from 'twitter-api-v2';

// Create a Twitter client
export const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

// Create a read-write client
export const rwClient = twitterClient.readWrite;