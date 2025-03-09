/**
 * This script tests the OpenRouter API connection by generating a simple response.
 * 
 * Usage:
 * 1. Make sure you have set up your .env.local file with your OpenRouter API key
 * 2. Run: npx ts-node --project tsconfig.json src/scripts/test-openrouter.ts
 */

import { config } from '../config';

async function testOpenRouter() {
  try {
    console.log('Testing OpenRouter API connection...');
    
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Twitter Monitoring Agent Test'
      },
      body: JSON.stringify({
        model: config.openrouter.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates short, concise responses.'
          },
          {
            role: 'user',
            content: 'Generate a sample tweet reply to: "Just launched our new product today!"'
          }
        ],
        max_tokens: 100,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log('\nOpenRouter API Response:');
    console.log('Model used:', data.model);
    console.log('Generated reply:', data.choices[0].message.content);
    console.log('\nAPI connection successful!');
  } catch (error) {
    console.error('Error testing OpenRouter API:', error);
  }
}

// Run the test
testOpenRouter();