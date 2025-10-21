#!/bin/bash

# Deploy to Vercel using local build (workaround for Vercel build issues)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 LOCAL BUILD & DEPLOY TO VERCEL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Step 1: Login to Vercel CLI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
vercel login
echo ""

echo "Step 2: Link to your Vercel project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "When prompted, select your existing project (crevo.app)"
vercel link
echo ""

echo "Step 3: Build for production locally"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
vercel build --prod
echo ""

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "Step 4: Deploy prebuilt version to production"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    vercel deploy --prebuilt --prod
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "Next: Test webhook on production"
else
    echo "❌ Build failed!"
    echo "Check the error messages above"
fi


