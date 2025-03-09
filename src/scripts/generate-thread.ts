import { redis } from '../lib/redis';
import { generateTwitterThread } from '../lib/openrouter/client';
import { config } from '../config';

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

async function generateThread(username: string) {
  try {
    console.log(`Generating thread for @${username}`);

    // Check if we already have a generated thread for this user
    const existingThread = await redis.get(`thread:${username}`);
    
    if (existingThread) {
      console.log(`Found existing thread for @${username}`);
      const thread = JSON.parse(existingThread as string);
      console.log('Thread posts:');
      thread.posts.forEach((post: ThreadPost) => {
        console.log(`${post.position}. [${post.category}] ${post.text}`);
      });
      return;
    }

    // Check if we have historical tweets for this user
    const tweetsCount = await redis.get(`historicalTweetsCount:${username}`);
    
    if (!tweetsCount || Number(tweetsCount) === 0) {
      console.error(`No historical tweets found for @${username}. Please fetch historical tweets first.`);
      return;
    }

    // Get the list of tweet IDs for this user
    const tweetIdsJson = await redis.get(`historicalTweetIds:${username}`);
    
    if (!tweetIdsJson) {
      console.error(`No tweet IDs found for @${username}. Please fetch historical tweets first.`);
      return;
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

    console.log('Thread generated successfully!');
    console.log('Thread posts:');
    thread.posts.forEach((post: ThreadPost) => {
      console.log(`${post.position}. [${post.category}] ${post.text}`);
    });
  } catch (error) {
    console.error('Error generating thread:', error);
  }
}

// Get username from command line arguments
const username = process.argv[2] || config.twitter.accountToMonitor;

if (!username) {
  console.error('Please provide a username as a command line argument or set it in the config file');
  process.exit(1);
}

generateThread(username)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });