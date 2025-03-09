#!/bin/bash

# Script to set up GitHub and Vercel integration for the Twitter Thread Generator project

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Twitter Thread Generator - GitHub and Vercel Setup Script${NC}"
echo "This script will help you set up GitHub and Vercel integration."
echo

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed. Please install git and try again.${NC}"
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}Warning: GitHub CLI is not installed. Some steps will need to be done manually.${NC}"
    HAS_GH=false
else
    HAS_GH=true
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Warning: Vercel CLI is not installed. Some steps will need to be done manually.${NC}"
    HAS_VERCEL=false
else
    HAS_VERCEL=true
fi

# Step 1: Initialize git repository if not already done
if [ ! -d .git ]; then
    echo -e "\n${GREEN}Step 1: Initializing git repository...${NC}"
    git init
    echo -e "${GREEN}Git repository initialized.${NC}"
else
    echo -e "\n${GREEN}Step 1: Git repository already initialized.${NC}"
fi

# Step 2: Create .gitignore file if it doesn't exist
if [ ! -f .gitignore ]; then
    echo -e "\n${GREEN}Step 2: Creating .gitignore file...${NC}"
    cat > .gitignore << EOL
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOL
    echo -e "${GREEN}.gitignore file created.${NC}"
else
    echo -e "\n${GREEN}Step 2: .gitignore file already exists.${NC}"
fi

# Step 3: Create GitHub repository
echo -e "\n${GREEN}Step 3: Creating GitHub repository...${NC}"
if [ "$HAS_GH" = true ]; then
    echo -e "Enter a name for your GitHub repository (e.g., twitter-thread-generator):"
    read REPO_NAME
    
    echo -e "Enter a description for your repository (optional):"
    read REPO_DESC
    
    echo -e "Make the repository private? (y/n):"
    read PRIVATE_CHOICE
    
    if [ "$PRIVATE_CHOICE" = "y" ] || [ "$PRIVATE_CHOICE" = "Y" ]; then
        PRIVATE="--private"
    else
        PRIVATE="--public"
    fi
    
    echo -e "Creating GitHub repository: $REPO_NAME..."
    gh repo create "$REPO_NAME" --description "$REPO_DESC" $PRIVATE --source=. --remote=origin
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}GitHub repository created successfully.${NC}"
    else
        echo -e "${RED}Failed to create GitHub repository. Please create it manually.${NC}"
    fi
else
    echo -e "${YELLOW}GitHub CLI not installed. Please create a GitHub repository manually and then run:${NC}"
    echo -e "git remote add origin https://github.com/yourusername/your-repo-name.git"
fi

# Step 4: Set up Vercel project
echo -e "\n${GREEN}Step 4: Setting up Vercel project...${NC}"
if [ "$HAS_VERCEL" = true ]; then
    echo -e "Setting up Vercel project..."
    vercel link
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Vercel project linked successfully.${NC}"
        
        # Get Vercel project info for GitHub Actions
        echo -e "\n${GREEN}Getting Vercel project information for GitHub Actions...${NC}"
        VERCEL_ORG_ID=$(vercel project ls -j | jq -r '.[] | select(.name == "'$(basename $(pwd))'") | .orgId')
        VERCEL_PROJECT_ID=$(vercel project ls -j | jq -r '.[] | select(.name == "'$(basename $(pwd))'") | .id')
        
        echo -e "Vercel Organization ID: ${YELLOW}$VERCEL_ORG_ID${NC}"
        echo -e "Vercel Project ID: ${YELLOW}$VERCEL_PROJECT_ID${NC}"
        
        echo -e "\n${YELLOW}Add these as secrets to your GitHub repository:${NC}"
        echo -e "VERCEL_ORG_ID: $VERCEL_ORG_ID"
        echo -e "VERCEL_PROJECT_ID: $VERCEL_PROJECT_ID"
        echo -e "VERCEL_TOKEN: (Get this from your Vercel account settings)"
    else
        echo -e "${RED}Failed to link Vercel project. Please set it up manually.${NC}"
    fi
else
    echo -e "${YELLOW}Vercel CLI not installed. Please set up your Vercel project manually.${NC}"
fi

# Step 5: Add and commit files
echo -e "\n${GREEN}Step 5: Adding and committing files...${NC}"
git add .
git commit -m "Initial setup with GitHub and Vercel integration"

# Step 6: Push to GitHub
echo -e "\n${GREEN}Step 6: Pushing to GitHub...${NC}"
echo -e "Do you want to push to GitHub now? (y/n):"
read PUSH_CHOICE

if [ "$PUSH_CHOICE" = "y" ] || [ "$PUSH_CHOICE" = "Y" ]; then
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully pushed to GitHub.${NC}"
    else
        echo -e "${RED}Failed to push to GitHub. Please push manually.${NC}"
    fi
else
    echo -e "${YELLOW}Skipping push to GitHub. You can push later with:${NC}"
    echo -e "git push -u origin main"
fi

# Final instructions
echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "Please refer to GITHUB_VERCEL_SETUP.md for additional instructions and troubleshooting."
echo -e "Don't forget to set up your environment variables in Vercel."
echo
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. If you haven't already, push your code to GitHub"
echo -e "2. Set up GitHub secrets for Vercel deployment"
echo -e "3. Configure environment variables in Vercel"
echo
echo -e "${GREEN}Happy coding!${NC}"