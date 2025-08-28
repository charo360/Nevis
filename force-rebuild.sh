#!/bin/bash

echo "🚨 FORCING COMPLETE REBUILD TO APPLY DESIGN FIX..."

# Stop any running processes
echo "1. Stopping any running processes..."
pkill -f "next"
pkill -f "node"

# Clear all caches
echo "2. Clearing all caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

# Clear npm cache
echo "3. Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies (optional but thorough)
echo "4. Reinstalling dependencies..."
rm -rf node_modules
npm install

# Build fresh
echo "5. Building fresh..."
npm run build

# Start development server
echo "6. Starting development server..."
npm run dev

echo "✅ REBUILD COMPLETE! The design fix should now be active."
