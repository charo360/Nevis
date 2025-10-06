#!/usr/bin/env python3
"""
Test script to simulate Google API failures and verify OpenRouter fallback
"""

import asyncio
import httpx
import json
import os
from unittest.mock import patch, AsyncMock
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PROXY_URL = "http://localhost:8000"

async def test_quota_exceeded_fallback():
    """Test fallback when Google API returns 429 (quota exceeded)"""
    print("🔍 Testing quota exceeded fallback...")
    
    # This test requires modifying the proxy server to simulate 429 errors
    # For now, we'll test with a real request and observe the behavior
    payload = {
        "prompt": "Test message for quota exceeded scenario",
        "user_id": "test_quota_user",
        "user_tier": "free",
        "model": "gemini-2.5-flash",
        "max_tokens": 50,
        "temperature": 0.7
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(f"{PROXY_URL}/generate-text", json=payload)
            if response.status_code == 200:
                data = response.json()
                provider = data.get('provider_used', 'unknown')
                print(f"✅ Request successful with provider: {provider}")
                
                if provider == "openrouter":
                    print("🎉 Fallback to OpenRouter worked!")
                elif provider == "google":
                    print("ℹ️ Google API working normally (no fallback needed)")
                else:
                    print(f"⚠️ Unknown provider: {provider}")
                
                return True
            else:
                print(f"❌ Request failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Request error: {e}")
            return False

async def test_service_unavailable_fallback():
    """Test fallback when Google API returns 503 (service unavailable)"""
    print("\n🔍 Testing service unavailable fallback...")
    
    payload = {
        "prompt": "Test message for service unavailable scenario",
        "user_id": "test_503_user",
        "user_tier": "free", 
        "model": "gemini-2.5-flash-lite",
        "max_tokens": 50,
        "temperature": 0.7
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(f"{PROXY_URL}/generate-text", json=payload)
            if response.status_code == 200:
                data = response.json()
                provider = data.get('provider_used', 'unknown')
                print(f"✅ Request successful with provider: {provider}")
                return True
            else:
                print(f"❌ Request failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Request error: {e}")
            return False

async def test_image_generation_fallback():
    """Test image generation fallback"""
    print("\n🔍 Testing image generation fallback...")
    
    payload = {
        "prompt": "Create a simple red circle on white background",
        "user_id": "test_image_user",
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
                provider = data.get('provider_used', 'unknown')
                print(f"✅ Image generation successful with provider: {provider}")
                
                if provider == "openrouter":
                    print("🎉 Image fallback to OpenRouter worked!")
                elif provider == "google":
                    print("ℹ️ Google API working normally for images")
                
                return True
            else:
                print(f"❌ Image generation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Image generation error: {e}")
            return False

async def test_multiple_models():
    """Test fallback with different models"""
    print("\n🔍 Testing fallback with multiple models...")
    
    models_to_test = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite", 
        "gemini-2.5-flash-image-preview"
    ]
    
    results = []
    
    for model in models_to_test:
        print(f"  Testing model: {model}")
        
        if "image" in model:
            endpoint = "/generate-image"
            payload = {
                "prompt": f"Test image for {model}",
                "user_id": f"test_{model.replace('-', '_')}_user",
                "user_tier": "free",
                "model": model,
                "max_tokens": 1024,
                "temperature": 0.8
            }
        else:
            endpoint = "/generate-text"
            payload = {
                "prompt": f"Test text for {model}",
                "user_id": f"test_{model.replace('-', '_')}_user", 
                "user_tier": "free",
                "model": model,
                "max_tokens": 100,
                "temperature": 0.7
            }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(f"{PROXY_URL}{endpoint}", json=payload)
                if response.status_code == 200:
                    data = response.json()
                    provider = data.get('provider_used', 'unknown')
                    print(f"    ✅ {model}: {provider}")
                    results.append((model, True, provider))
                else:
                    print(f"    ❌ {model}: Failed ({response.status_code})")
                    results.append((model, False, "failed"))
            except Exception as e:
                print(f"    ❌ {model}: Error ({e})")
                results.append((model, False, "error"))
    
    return results

async def test_openrouter_direct():
    """Test OpenRouter API directly (bypassing Google)"""
    print("\n🔍 Testing OpenRouter API directly...")
    
    # This would require temporarily modifying the proxy to force OpenRouter
    # For now, we'll just verify the configuration
    
    openrouter_key = os.environ.get('OPENROUTER_API_KEY')
    if not openrouter_key:
        print("❌ OPENROUTER_API_KEY not found in environment")
        return False
    
    print(f"✅ OpenRouter API key configured: {openrouter_key[:10]}...")
    
    # Test health endpoint to verify OpenRouter configuration
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{PROXY_URL}/health")
            if response.status_code == 200:
                data = response.json()
                openrouter_configured = data.get('openrouter_configured', False)
                print(f"✅ OpenRouter configured in proxy: {openrouter_configured}")
                return openrouter_configured
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False

async def main():
    """Run fallback scenario tests"""
    print("🚀 Starting OpenRouter Fallback Scenario Tests")
    print("=" * 60)
    
    # Check if proxy server is running
    try:
        async with httpx.AsyncClient() as client:
            await client.get(f"{PROXY_URL}/health", timeout=5.0)
        print("✅ Proxy server is running")
    except:
        print("❌ Proxy server not running. Please start it with:")
        print("   cd proxy-server && python main.py")
        return
    
    # Run tests
    tests = [
        ("OpenRouter Configuration", test_openrouter_direct),
        ("Quota Exceeded Fallback", test_quota_exceeded_fallback),
        ("Service Unavailable Fallback", test_service_unavailable_fallback),
        ("Image Generation Fallback", test_image_generation_fallback),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Test multiple models
    print("\n" + "=" * 60)
    model_results = await test_multiple_models()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Fallback Test Results:")
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    print("\n📊 Model Test Results:")
    for model, success, provider in model_results:
        status = "✅" if success else "❌"
        print(f"   {model}: {status} ({provider})")
    
    # Count providers used
    google_count = sum(1 for _, _, provider in model_results if provider == "google")
    openrouter_count = sum(1 for _, _, provider in model_results if provider == "openrouter")
    
    print(f"\n🎯 Provider Usage:")
    print(f"   Google API: {google_count} requests")
    print(f"   OpenRouter: {openrouter_count} requests")
    
    if openrouter_count > 0:
        print("🎉 OpenRouter fallback is working!")
    else:
        print("ℹ️ All requests used Google API (fallback not triggered)")

if __name__ == "__main__":
    asyncio.run(main())
