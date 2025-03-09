# Deployment Guide

This guide will walk you through deploying the Twitter Monitoring Agent to Vercel.

## Prerequisites

Before you begin, make sure you have:

1. A [Vercel account](https://vercel.com/signup)
2. A [GitHub account](https://github.com/signup)
3. [Twitter API credentials](https://developer.twitter.com/en/portal/dashboard)
4. An [OpenRouter API key](https://openrouter.ai/keys)

## Step 1: Push to GitHub

1. Create a new GitHub repository
2. Initialize your local repository and push to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/twitter-monitoring-agent.git
git push -u origin main
```

## Step 2: Connect to Vercel

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: (leave as default)
   - Output Directory: (leave as default)

## Step 3: Configure Environment Variables

Add the following environment variables in the Vercel project settings:

```
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
OPENROUTER_API_KEY=your_openrouter_api_key
TWITTER_ACCOUNTS_TO_MONITOR=account1,account2,account3
```

## Step 4: Set Up Vercel KV

1. In your Vercel dashboard, go to "Storage" > "KV"
2. Click "Create Database"
3. Select a region close to your deployment
4. Connect the KV database to your project
5. Vercel will automatically add the required KV environment variables to your project

## Step 5: Deploy

1. Click "Deploy" to deploy your project
2. Once deployed, your Twitter Monitoring Agent will be live
3. The cron job will run hourly as specified in `vercel.json`

## Step 6: Verify Deployment

1. Visit your deployed application at `https://your-project.vercel.app`
2. Navigate to the dashboard at `https://your-project.vercel.app/dashboard`
3. Click "Run Monitor Now" to manually trigger the monitoring process
4. Check the results on the dashboard

## Troubleshooting

### Cron Job Not Running

- Verify that you have the Vercel Pro or Enterprise plan, as cron jobs are not available on the free plan
- Check that your `vercel.json` file is correctly configured
- Review the Function Logs in the Vercel dashboard for any errors

### API Errors

- Ensure all environment variables are correctly set
- Check that your Twitter API credentials have the necessary permissions
- Verify that your OpenRouter API key is valid
- Review the Function Logs for detailed error messages

### Rate Limiting

- Twitter API has rate limits that may affect the number of tweets that can be processed
- Consider adjusting the monitoring frequency or the number of accounts monitored

## Monitoring and Maintenance

- Regularly check the dashboard to ensure the agent is working correctly
- Monitor your Twitter API usage to avoid hitting rate limits
- Keep your API credentials secure and rotate them periodically
- Update the application as needed to accommodate changes in the Twitter API or OpenRouter API

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)