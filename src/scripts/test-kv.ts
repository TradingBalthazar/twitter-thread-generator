/**
 * This script tests the Vercel KV connection by setting and getting a test value.
 * 
 * Usage:
 * 1. Make sure you have set up your .env.local file with your Vercel KV credentials
 * 2. Run: npx ts-node --project tsconfig.json src/scripts/test-kv.ts
 */

import { kv } from '@vercel/kv';

async function testKV() {
  try {
    console.log('Testing Vercel KV connection...');
    
    // Check if KV environment variables are set
    const requiredVars = [
      'KV_URL',
      'KV_REST_API_URL',
      'KV_REST_API_TOKEN',
      'KV_REST_API_READ_ONLY_TOKEN'
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
    await kv.set(testKey, testValue);
    console.log('Value set successfully');
    
    // Test 2: Get the value
    console.log('Getting test value...');
    const retrievedValue = await kv.get(testKey);
    console.log(`Retrieved value: ${JSON.stringify(retrievedValue)}`);
    
    if (JSON.stringify(retrievedValue) === JSON.stringify(testValue)) {
      console.log('Values match! KV connection is working correctly');
    } else {
      console.error('Values do not match! KV connection may have issues');
    }
    
    // Test 3: Delete the value
    console.log('Deleting test value...');
    await kv.del(testKey);
    console.log('Value deleted successfully');
    
    // Test 4: Verify deletion
    const deletedValue = await kv.get(testKey);
    if (deletedValue === null) {
      console.log('Deletion verified! Value is null as expected');
    } else {
      console.error('Deletion failed! Value still exists:', deletedValue);
    }
    
    console.log('\nVercel KV connection test completed successfully!');
  } catch (error) {
    console.error('Error testing Vercel KV:', error);
    console.log('\nIf you are running this locally without Vercel KV set up, you can use the mock KV implementation:');
    console.log('npm run use-mock-kv');
  }
}

// Run the test
testKV();