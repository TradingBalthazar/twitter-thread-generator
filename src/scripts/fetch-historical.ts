import { config } from '../config';
import { rwClient } from '../lib/twitter/client';
import { redis } from '../lib/redis';

// Define a new interface for historical tweets with additional metadata
interface HistoricalTweet {
  id: string;
  text: string;
  authorUsername: string;
  processedAt: number;
  replied: boolean;
  createdAt: string;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  quoteCount?: number;
}

async function fetchHistoricalTweets(username: string) {
  console.log(`Fetching historical tweets for @${username}`);

  // Check if we already have tweets for this user in the database
  const existingTweetsCount = await redis.get(`historicalTweetsCount:${username}`);
  
  if (existingTweetsCount && Number(existingTweetsCount) > 0) {
    console.log(`Found ${existingTweetsCount} existing historical tweets for @${username}`);
    return;
  }

  // Get user ID from username
  const userLookup = await rwClient.v2.userByUsername(username);
  if (!userLookup.data) {
    console.error(`Could not find user: ${username}`);
    return;
  }

  const userId = userLookup.data.id;
  console.log(`Found user ID for @${username}: ${userId}`);

  // Initialize variables for pagination
  let paginationToken: string | undefined = undefined;
  let totalTweets = 0;
  const maxTweets = 1500; // Twitter API limit for historical data
  const batchSize = 100; // Maximum per request
  const allTweets: HistoricalTweet[] = [];
  
  // Twitter API rate limit is 15 requests per 15 minutes for this endpoint
  // We'll need to make multiple requests with pagination to get all tweets
  while (totalTweets < maxTweets) {
    console.log(`Fetching batch of tweets for @${username}, current total: ${totalTweets}`);
    
    try {
      const userTimeline = await rwClient.v2.userTimeline(userId, {
        max_results: batchSize,
        pagination_token: paginationToken,
        "tweet.fields": [
          "created_at", 
          "public_metrics", 
          "text"
        ],
        exclude: ["retweets", "replies"] // Only get original tweets
      });
      
      if (!userTimeline.data || userTimeline.data.meta.result_count === 0) {
        console.log(`No more tweets found for @${username}`);
        break;
      }
      
      // Process tweets in this batch
      for (const tweet of userTimeline.data.data) {
        const historicalTweet: HistoricalTweet = {
          id: tweet.id,
          text: tweet.text,
          authorUsername: username,
          processedAt: Date.now(),
          replied: false,
          createdAt: tweet.created_at || new Date().toISOString(),
          likeCount: tweet.public_metrics?.like_count,
          retweetCount: tweet.public_metrics?.retweet_count,
          replyCount: tweet.public_metrics?.reply_count,
          quoteCount: tweet.public_metrics?.quote_count
        };
        
        allTweets.push(historicalTweet);
        
        // Store each tweet in Redis
        await redis.set(`historicalTweet:${username}:${tweet.id}`, JSON.stringify(historicalTweet));
      }
      
      totalTweets += userTimeline.data.meta.result_count;
      console.log(`Fetched ${userTimeline.data.meta.result_count} tweets, total now: ${totalTweets}`);
      
      // Check if there are more tweets to fetch
      if (!userTimeline.data.meta.next_token) {
        console.log(`No more pagination tokens, ending fetch for @${username}`);
        break;
      }
      
      paginationToken = userTimeline.data.meta.next_token;
      
      // Add a small delay to avoid hitting rate limits too quickly
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching tweets batch for @${username}:`, error);
      // If we hit a rate limit, we'll break and return what we have so far
      break;
    }
  }
  
  // Store the total count
  await redis.set(`historicalTweetsCount:${username}`, totalTweets.toString());
  
  // Store the list of tweet IDs for this user
  const tweetIds = allTweets.map(tweet => tweet.id);
  await redis.set(`historicalTweetIds:${username}`, JSON.stringify(tweetIds));
  
  console.log(`Successfully fetched ${totalTweets} historical tweets for @${username}`);
}

// Get username from command line arguments
const username = process.argv[2] || config.twitter.accountToMonitor;

if (!username) {
  console.error('Please provide a username as a command line argument or set it in the config file');
  process.exit(1);
}

fetchHistoricalTweets(username)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });