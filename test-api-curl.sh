#!/bin/bash

echo "🚀 Testing Social Media Expert API with curl..."

# Base URL
BASE_URL="http://localhost:3001/api/social-media-expert"

# Test 1: Business Analysis
echo "\n📊 Test 1: Business Analysis"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "businessProfile": {
      "businessName": "Samaki Cookies",
      "businessType": "restaurant",
      "industry": "Food & Beverage",
      "location": "Nairobi",
      "city": "Nairobi",
      "country": "Kenya",
      "description": "Artisanal cookie bakery specializing in nutritious, locally-sourced ingredients",
      "mission": "To provide healthy, delicious cookies while fighting malnutrition in Kenya",
      "targetAudience": ["Families", "Health-conscious individuals", "Children"],
      "services": ["Artisanal cookies", "Custom orders", "Corporate catering"],
      "brandColors": ["#8B4513", "#228B22", "#FFD700"],
      "visualStyle": "rustic",
      "platforms": ["Instagram", "Facebook", "LinkedIn"]
    }
  }' | jq '.'

# Test 2: Generate Posts
echo "\n📝 Test 2: Generate Posts"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate-posts",
    "businessProfile": {
      "businessName": "Samaki Cookies",
      "businessType": "restaurant",
      "industry": "Food & Beverage",
      "location": "Nairobi",
      "city": "Nairobi",
      "country": "Kenya",
      "description": "Artisanal cookie bakery specializing in nutritious, locally-sourced ingredients",
      "mission": "To provide healthy, delicious cookies while fighting malnutrition in Kenya",
      "targetAudience": ["Families", "Health-conscious individuals", "Children"],
      "services": ["Artisanal cookies", "Custom orders", "Corporate catering"],
      "brandColors": ["#8B4513", "#228B22", "#FFD700"],
      "visualStyle": "rustic",
      "platforms": ["Instagram", "Facebook", "LinkedIn"]
    },
    "platform": "Instagram",
    "count": 3
  }' | jq '.'

# Test 3: Complete Package
echo "\n🎯 Test 3: Complete Package"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "complete-package",
    "businessProfile": {
      "businessName": "Samaki Cookies",
      "businessType": "restaurant",
      "industry": "Food & Beverage",
      "location": "Nairobi",
      "city": "Nairobi",
      "country": "Kenya",
      "description": "Artisanal cookie bakery specializing in nutritious, locally-sourced ingredients",
      "mission": "To provide healthy, delicious cookies while fighting malnutrition in Kenya",
      "targetAudience": ["Families", "Health-conscious individuals", "Children"],
      "services": ["Artisanal cookies", "Custom orders", "Corporate catering"],
      "brandColors": ["#8B4513", "#228B22", "#FFD700"],
      "visualStyle": "rustic",
      "platforms": ["Instagram", "Facebook", "LinkedIn"]
    },
    "platform": "Instagram",
    "count": 5
  }' | jq '.'

echo "\n✅ API testing complete!"
