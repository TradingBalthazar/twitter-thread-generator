# Setup Guide

This guide will walk you through setting up the Twitter Monitoring Agent for local development.

## Prerequisites

Before you begin, make sure you have:

1. Node.js (v16 or later) and npm installed
2. [Twitter Developer Account](https://developer.twitter.com/en/apply-for-access) with API credentials
3. [OpenRouter API key](https://openrouter.ai/keys)

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd twitter-monitoring-agent
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` in your editor and fill in your API credentials:
   ```
   TWITTER_API_KEY=your_twitter_api_key
   TWITTER_API_SECRET=your_twitter_api_secret
   TWITTER_ACCESS_TOKEN=your_twitter_access_token
   TWITTER_ACCESS_SECRET=your_twitter_access_secret
   OPENROUTER_API_KEY=your_openrouter_api_key
   TWITTER_ACCOUNTS_TO_MONITOR=account1,account2,account3
   ```

## Step 4: Set Up Vercel KV for Local Development

For local development, you have two options:

### Option A: Use Vercel CLI (Recommended)

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   vercel link
   ```

4. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

### Option B: Use the Mock KV Implementation

If you don't want to set up Vercel KV, you can use the included mock KV implementation:

```bash
npm run use-mock-kv
```

This will modify the necessary files to use an in-memory KV store instead of the real Vercel KV. To switch back to the real implementation:

```bash
npm run use-real-kv
```

Note: The mock implementation stores data in memory, so data will be lost when the server restarts.

## Step 5: Test API Connections

1. Test Twitter API connection:
   ```bash
   npm run test-twitter
   ```

2. Test OpenRouter API connection:
   ```bash
   npm run test-openrouter
   ```

3. Test Vercel KV connection (if using Vercel KV):
   ```bash
   npm run test-kv
   ```

## Step 6: Run the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Step 7: Test the Monitoring Functionality

1. In a separate terminal, run:
   ```bash
   npm run test-monitor
   ```

2. Check the console output to see if tweets are being processed correctly.

3. Visit http://localhost:3000/dashboard to see the processed tweets in the dashboard.

## Troubleshooting

### Twitter API Issues

- Ensure your Twitter API credentials have the necessary permissions
- Check that your Twitter account has elevated access if needed
- Verify that the accounts you're monitoring exist and are public

### OpenRouter API Issues

- Ensure your OpenRouter API key is valid
- Check that you have sufficient credits in your OpenRouter account
- Verify that the model specified in `src/config/index.ts` is available

### Vercel KV Issues

- If using the Vercel CLI, ensure you're logged in and have linked your project
- Check that your KV database is properly set up in the Vercel dashboard
- Verify that the KV environment variables are correctly set in your `.env.local` file
- If you encounter KV connection issues, try using the mock implementation:
  ```bash
  npm run use-mock-kv
  ```
- To switch back to the real KV implementation:
  ```bash
  npm run use-real-kv
  ```

## Next Steps

Once you've confirmed that everything is working locally, you can deploy the application to Vercel. See the [Deployment Guide](DEPLOYMENT.md) for instructions.