#!/bin/bash

# Set up proxies
export http_proxy=http://proxy-prod-dku.oit.duke.edu:3128
export https_proxy=http://proxy-prod-dku.oit.duke.edu:3128

echo "Proxies set up successfully"

# Check if we have the latest changes from GitHub
echo "Checking for latest changes from GitHub..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

# Check if .vercel directory exists
if [ -d ".vercel" ]; then
  echo "Vercel configuration found. Deploying using existing configuration..."
  npx vercel --prod
else
  echo "No Vercel configuration found. Deploying for the first time..."
  echo "Please follow the instructions to connect your GitHub repository to Vercel:"
  echo "1. Go to https://vercel.com/import/git"
  echo "2. Select your GitHub repository (yi-rui-huang/filterbubble)"
  echo "3. Configure your project settings"
  echo "4. Deploy"
  echo ""
  echo "Alternatively, you can run the following command and follow the prompts:"
  echo "npx vercel"
fi

echo "Done! Your project has been deployed to Vercel."
