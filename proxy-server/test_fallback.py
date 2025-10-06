#!/usr/bin/env python3
"""
Test script for OpenRouter fallback system
"""

import asyncio
import httpx
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PROXY_URL = "http://localhost:8000"

async def test_health_endpoint():
    """Test the health endpoint to verify fallback configuration"""
    print("🔍 Testing health endpoint...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{PROXY_URL}/health")
            if response.status_code == 200:
                data = response.json()
                print("✅ Health endpoint successful")
                print(f"   OpenRouter configured: {data.get('openrouter_configured', False)}")
                print(f"   Fallback models: {data.get('fallback_models', [])}")
                return True
            else:
                print(f"❌ Health endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health endpoint error: {e}")
            return False

async def test_text_generation():
    """Test text generation with fallback"""
    print("\n🔍 Testing text generation...")
    
    payload = {
        "prompt": "Hello, this is a test message. Please respond with 'API working correctly'.",
        "user_id": "test_user",
        "user_tier": "free",
        "model": "gemini-2.5-flash",
        "max_tokens": 100,
        "temperature": 0.7
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(f"{PROXY_URL}/generate-text", json=payload)
            if response.status_code == 200:
                data = response.json()
                print("✅ Text generation successful")
                print(f"   Provider used: {data.get('provider_used', 'unknown')}")
                print(f"   Model used: {data.get('model_used', 'unknown')}")
                print(f"   Response preview: {str(data.get('data', {}))[:200]}...")
                return True
            else:
                print(f"❌ Text generation failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Text generation error: {e}")
            return False

async def test_image_generation():
    """Test image generation with fallback"""
    print("\n🔍 Testing image generation...")
    
    payload = {
        "prompt": "Create a simple test image with blue background and white text saying 'Test'",
        "user_id": "test_user", 
        "user_tier": "free",
        "model": "gemini-2.5-flash-image-preview",
        "max_tokens": 1024,
        "temperature": 0.8
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(f"{PROXY_URL}/generate-image", json=payload)
            if response.status_code == 200:
                data = response.json()
                print("✅ Image generation successful")
                print(f"   Provider used: {data.get('provider_used', 'unknown')}")
                print(f"   Model used: {data.get('model_used', 'unknown')}")
                print(f"   Response type: {type(data.get('data', {}))}")
                return True
            else:
                print(f"❌ Image generation failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Image generation error: {e}")
            return False

async def test_credits_endpoint():
    """Test credits endpoint"""
    print("\n🔍 Testing credits endpoint...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{PROXY_URL}/credits/test_user")
            if response.status_code == 200:
                data = response.json()
                print("✅ Credits endpoint successful")
                print(f"   Credits remaining: {data.get('credits_remaining', 'unknown')}")
                print(f"   User tier: {data.get('tier', 'unknown')}")
                return True
            else:
                print(f"❌ Credits endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Credits endpoint error: {e}")
            return False

async def main():
    """Run all tests"""
    print("🚀 Starting OpenRouter Fallback System Tests")
    print("=" * 50)
    
    # Check if proxy server is running
    try:
        async with httpx.AsyncClient() as client:
            await client.get(f"{PROXY_URL}/health", timeout=5.0)
    except:
        print("❌ Proxy server not running. Please start it with:")
        print("   cd proxy-server && python main.py")
        return
    
    # Run tests
    tests = [
        ("Health Endpoint", test_health_endpoint),
        ("Text Generation", test_text_generation),
        ("Image Generation", test_image_generation),
        ("Credits Endpoint", test_credits_endpoint)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! OpenRouter fallback system is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the logs above for details.")

if __name__ == "__main__":
    asyncio.run(main())
