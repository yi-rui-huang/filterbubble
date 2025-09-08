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

# Check if there are any commits
commit_count=$(git rev-list --count --all)
echo "Commit count: $commit_count"

if [ "$commit_count" -eq 0 ]; then
  echo "No commits found. Creating initial commit..."
  git add .
  git commit -m "Initial commit"
fi

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin $current_branch

echo "Done! Your project has been pushed to GitHub."
