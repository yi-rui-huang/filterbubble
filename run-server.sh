#!/bin/bash

# Configuration
APP_DIR="/home/hyr/115/filterbubble"
LOG_FILE="$APP_DIR/server.log"
PID_FILE="$APP_DIR/server.pid"

# Function to start the server
start_server() {
  echo "Starting Vite server..."
  cd "$APP_DIR" || exit 1
  
  # Check if server is already running
  if [ -f "$PID_FILE" ] && ps -p "$(cat "$PID_FILE")" > /dev/null; then
    echo "Server is already running with PID $(cat "$PID_FILE")"
    return 1
  fi
  
  # Start the server with nohup
  nohup npm run dev > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  echo "Server started with PID $(cat "$PID_FILE")"
  echo "Logs are being written to $LOG_FILE"
}

# Function to stop the server
stop_server() {
  echo "Stopping Vite server..."
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null; then
      kill "$PID"
      echo "Server with PID $PID stopped"
    else
      echo "Server is not running (PID $PID not found)"
    fi
    rm "$PID_FILE"
  else
    echo "PID file not found, server might not be running"
    # Try to find and kill the process anyway
    PIDS=$(pgrep -f "npm run dev")
    if [ -n "$PIDS" ]; then
      echo "Found running server processes: $PIDS"
      echo "Killing processes..."
      pkill -f "npm run dev"
      echo "Processes killed"
    fi
  fi
}

# Function to check server status
status_server() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null; then
      echo "Server is running with PID $PID"
      echo "To view logs: tail -f $LOG_FILE"
    else
      echo "Server is not running (PID file exists but process is dead)"
    fi
  else
    echo "Server is not running (no PID file)"
  fi
}

# Function to view logs
view_logs() {
  if [ -f "$LOG_FILE" ]; then
    tail -n 50 -f "$LOG_FILE"
  else
    echo "Log file not found"
  fi
}

# Main script logic
case "$1" in
  start)
    start_server
    ;;
  stop)
    stop_server
    ;;
  restart)
    stop_server
    sleep 2
    start_server
    ;;
  status)
    status_server
    ;;
  logs)
    view_logs
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs}"
    exit 1
    ;;
esac

exit 0
