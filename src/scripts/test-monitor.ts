/**
 * This script is for testing the Twitter monitoring functionality locally.
 * It simulates the cron job by making a request to the monitor API endpoint.
 * 
 * Usage:
 * 1. Make sure you have set up your .env.local file with the required environment variables
 * 2. Run the development server: npm run dev
 * 3. In a separate terminal, run: npx ts-node --project tsconfig.json src/scripts/test-monitor.ts
 */

async function testMonitor() {
  try {
    console.log('Testing Twitter monitoring functionality...');
    
    // Make a request to the monitor API endpoint
    const response = await fetch('http://localhost:3000/api/twitter/monitor', {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    console.log(`Processed ${data.processed} tweets`);
    
    if (data.results && data.results.length > 0) {
      console.log('\nProcessed tweets:');
      data.results.forEach((tweet: any, index: number) => {
        console.log(`\n--- Tweet ${index + 1} ---`);
        console.log(`ID: ${tweet.id}`);
        console.log(`Author: @${tweet.authorUsername}`);
        console.log(`Text: ${tweet.text}`);
        console.log(`Replied: ${tweet.replied ? 'Yes' : 'No'}`);
        if (tweet.replyText) {
          console.log(`Reply: ${tweet.replyText}`);
        }
      });
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing Twitter monitoring:', error);
  }
}

// Run the test
testMonitor();