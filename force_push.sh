#!/bin/bash

# Set up proxies
export http_proxy=http://proxy-prod-dku.oit.duke.edu:3128
export https_proxy=http://proxy-prod-dku.oit.duke.edu:3128

echo "Proxies set up successfully"

# Check current branch
echo "Checking current branch..."
current_branch=$(git branch --show-current)

if [ -z "$current_branch" ]; then
  echo "No branch found. Creating main branch..."
  git checkout -b main
  current_branch="main"
else
  echo "Current branch is: $current_branch"
fi

# Force push to GitHub
echo "Force pushing to GitHub..."
git push -f origin $current_branch

echo "Done! Your project has been pushed to GitHub."
