#!/bin/bash
# Script to start a development server on port 3002

cd "$(dirname "$0")"
npm run dev -- --port 3002
