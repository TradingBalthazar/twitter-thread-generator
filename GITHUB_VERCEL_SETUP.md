# GitHub and Vercel Integration Setup

This document provides instructions for setting up continuous integration and deployment with GitHub and Vercel for the Twitter Thread Generator project.

## Prerequisites

1. A GitHub account
2. A Vercel account
3. The Twitter Thread Generator project code

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account
2. Click on the "+" icon in the top-right corner and select "New repository"
3. Name your repository (e.g., "twitter-thread-generator")
4. Choose whether to make it public or private
5. Click "Create repository"

## Step 2: Push Your Code to GitHub

```bash
# Initialize git in your project directory (if not already done)
git init

# Add the GitHub repository as a remote
git remote add origin https://github.com/yourusername/twitter-thread-generator.git

# Add all files to git
git add .

# Commit the files
git commit -m "Initial commit"

# Push to GitHub
git push -u origin main
```

## Step 3: Set Up Vercel Integration

1. Go to [Vercel](https://vercel.com) and sign in to your account
2. Click "Add New..." and select "Project"
3. Import your GitHub repository
4. Configure your project settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
5. Add the following environment variables:
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_SECRET`
   - `OPENROUTER_API_KEY`
   - Any other environment variables required by your project
6. Click "Deploy"

## Step 4: Set Up GitHub Actions for Continuous Deployment

1. In your GitHub repository, go to "Settings" > "Secrets and variables" > "Actions"
2. Add the following secrets:
   - `VERCEL_TOKEN`: Your Vercel API token (get from Vercel account settings)
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

You can find your Vercel organization ID and project ID by running:
```bash
vercel whoami
vercel projects
```

## Step 5: Configure Automatic Deployments

The GitHub Actions workflow file (`.github/workflows/deploy.yml`) is already set up to:
1. Run on every push to the main branch
2. Install dependencies
3. Run linting
4. Deploy to Vercel production

## Step 6: Set Up Commit Hooks (Optional)

To ensure code quality before committing, you can set up pre-commit hooks:

1. Install Husky:
```bash
npm install --save-dev husky lint-staged
```

2. Add the following to your package.json:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## Workflow

With this setup, your development workflow will be:

1. Make changes to your code
2. Commit and push to GitHub
3. GitHub Actions will automatically deploy your changes to Vercel
4. Your changes will be live on your Vercel URL

## Troubleshooting

If you encounter any issues with the deployment:

1. Check the GitHub Actions logs for errors
2. Verify your Vercel environment variables are correctly set
3. Ensure your Vercel project is properly configured
4. Check that your GitHub secrets are correctly set up