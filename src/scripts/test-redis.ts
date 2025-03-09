/**
 * This script tests the Upstash Redis connection by setting and getting a test value.
 * 
 * Usage:
 * 1. Make sure you have set up your .env.local file with your Upstash Redis credentials
 * 2. Run: npx ts-node --project tsconfig.json src/scripts/test-redis.ts
 */

import { redis } from '../lib/redis';

async function testRedis() {
  try {
    console.log('Testing Upstash Redis connection...');
    
    // Check if Redis environment variables are set
    const requiredVars = [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN'
    ];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        console.warn(`Warning: ${varName} environment variable is not set`);
      }
    }
    
    // Test 1: Set a value
    const testKey = 'test:connection';
    const testValue = {
      timestamp: Date.now(),
      message: 'Hello from Twitter Monitoring Agent!'
    };
    
    console.log(`Setting test value: ${JSON.stringify(testValue)}`);
    await redis.set(testKey, testValue);
    console.log('Value set successfully');
    
    // Test 2: Get the value
    console.log('Getting test value...');
    const retrievedValue = await redis.get(testKey);
    console.log(`Retrieved value: ${JSON.stringify(retrievedValue)}`);
    
    if (JSON.stringify(retrievedValue) === JSON.stringify(testValue)) {
      console.log('Values match! Redis connection is working correctly');
    } else {
      console.error('Values do not match! Redis connection may have issues');
    }
    
    // Test 3: Delete the value
    console.log('Deleting test value...');
    await redis.del(testKey);
    console.log('Value deleted successfully');
    
    // Test 4: Verify deletion
    const deletedValue = await redis.get(testKey);
    if (deletedValue === null) {
      console.log('Deletion verified! Value is null as expected');
    } else {
      console.error('Deletion failed! Value still exists:', deletedValue);
    }
    
    console.log('\nUpstash Redis connection test completed successfully!');
  } catch (error) {
    console.error('Error testing Upstash Redis:', error);
    console.log('\nIf you are running this locally without Upstash Redis set up, you can use the mock Redis implementation:');
    console.log('npm run use-mock-redis');
  }
}

// Run the test
testRedis();