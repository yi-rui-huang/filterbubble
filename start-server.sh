#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

# Kill any process using port 3000 (if needed)
fuser -k 3000/tcp 2>/dev/null

# Start the application with HTTPS
while true; do
  echo "Starting FilterBubble application on port 3000 with HTTPS..."
  npm run dev -- --port 3000 --host
  echo "Server stopped, restarting in 5 seconds..."
  sleep 5
done
