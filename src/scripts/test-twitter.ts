/**
 * This script tests the Twitter API connection by fetching the authenticated user's profile
 * and a sample of tweets from specified accounts.
 * 
 * Usage:
 * 1. Make sure you have set up your .env.local file with your Twitter API credentials
 * 2. Run: npx ts-node --project tsconfig.json src/scripts/test-twitter.ts
 */

import { twitterClient, rwClient } from '../lib/twitter/client';
import { config } from '../config';
import { redis } from '../lib/redis';

async function testTwitter() {
  try {
    console.log('Testing Twitter API connection...');
    
    // Check if all required environment variables are set
    const requiredVars = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_SECRET'
    ];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`${varName} environment variable is not set`);
      }
    }
    
    // Test 1: Get authenticated user
    console.log('\nFetching authenticated user...');
    const me = await rwClient.v2.me();
    console.log(`Authenticated as: @${me.data.username} (ID: ${me.data.id})`);
    
    // Test 2: Check account monitoring configuration
    console.log('\nAccount monitoring configuration:');
    console.log(`- Account to monitor: @${config.twitter.accountToMonitor}`);
    console.log(`- Check interval: ${config.twitter.checkInterval} minutes`);
    
    // Test 3: Fetch recent tweets from the monitored account
    console.log(`\nFetching recent tweets from @${config.twitter.accountToMonitor}...`);
    try {
      // Get user ID from username
      const userLookup = await rwClient.v2.userByUsername(config.twitter.accountToMonitor);
      
      if (!userLookup.data) {
        console.error(`Could not find user: @${config.twitter.accountToMonitor}`);
      } else {
        const userId = userLookup.data.id;
        console.log(`Found user: @${config.twitter.accountToMonitor} (ID: ${userId})`);
        
        // Fetch recent tweets
        const userTimeline = await rwClient.v2.userTimeline(userId, {
          max_results: 5,
          "tweet.fields": ["created_at", "text"],
          exclude: ["retweets", "replies"] // Only get original tweets
        });
        
        if (userTimeline.data.meta.result_count > 0) {
          console.log(`Found ${userTimeline.data.meta.result_count} tweets`);
          
          // Display sample tweets
          console.log('\nMost recent tweets:');
          for (let i = 0; i < Math.min(3, userTimeline.data.data.length); i++) {
            const tweet = userTimeline.data.data[i];
            
            console.log(`\nTweet ${i+1}:`);
            console.log(`- ID: ${tweet.id}`);
            console.log(`- Text: ${tweet.text}`);
            console.log(`- Created at: ${tweet.created_at}`);
          }
          
          // Get the last processed ID
          const lastProcessedId = await redis.get(`lastProcessedId:${config.twitter.accountToMonitor}`);
          console.log(`\nLast processed ID for @${config.twitter.accountToMonitor}: ${lastProcessedId || 'None'}`);
          
          if (lastProcessedId) {
            // Check if there are new tweets
            const newTweets = userTimeline.data.data.filter(tweet => tweet.id > lastProcessedId);
            console.log(`Number of new tweets since last processed: ${newTweets.length}`);
          }
        } else {
          console.log('No tweets found');
        }
      }
    } catch (error) {
      console.error(`Error fetching tweets for @${config.twitter.accountToMonitor}:`, error);
    }
    
    console.log('\nTwitter API connection test completed successfully!');
  } catch (error) {
    console.error('Error testing Twitter API:', error);
  }
}

// Run the test
testTwitter();