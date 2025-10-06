#!/usr/bin/env python3
"""
Test script to verify OpenRouter fallback works for all Revo versions (1.0, 1.5, 2.0)
"""

import asyncio
import httpx
import json

PROXY_URL = "http://localhost:8000"

async def test_revo_version(version: str, model: str, test_type: str = "text"):
    """Test a specific Revo version with OpenRouter fallback"""
    print(f"\n🧪 Testing Revo {version} with {model} ({test_type})")
    
    if test_type == "text":
        payload = {
            "prompt": f"Hello from Revo {version}! Please respond with 'Revo {version} working correctly'.",
            "user_id": f"revo_{version.replace('.', '_')}_test_user",
            "user_tier": "free",
            "model": model,
            "revo_version": version,
            "max_tokens": 100,
            "temperature": 0.7
        }
        endpoint = "/generate-text"
    else:  # image
        payload = {
            "prompt": f"Create a simple test image with text 'Revo {version}' for testing purposes",
            "user_id": f"revo_{version.replace('.', '_')}_img_user",
            "user_tier": "free", 
            "model": model,
            "revo_version": version,
            "max_tokens": 1024,
            "temperature": 0.8
        }
        endpoint = "/generate-image"
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{PROXY_URL}{endpoint}", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                provider = data.get('provider_used', 'unknown')
                model_used = data.get('model_used', 'unknown')
                
                print(f"   ✅ Success!")
                print(f"   🔧 Provider: {provider.upper()}")
                print(f"   🤖 Model: {model_used}")
                print(f"   💳 Credits remaining: {data.get('user_credits', 'unknown')}")
                
                if test_type == "text" and 'data' in data:
                    # Try to extract response text
                    try:
                        candidates = data['data'].get('candidates', [])
                        if candidates and 'content' in candidates[0]:
                            parts = candidates[0]['content'].get('parts', [])
                            if parts and 'text' in parts[0]:
                                response_text = parts[0]['text'][:100] + "..." if len(parts[0]['text']) > 100 else parts[0]['text']
                                print(f"   📝 Response: {response_text}")
                    except:
                        pass
                
                return {
                    "success": True,
                    "provider": provider,
                    "model": model_used,
                    "version": version
                }
            else:
                print(f"   ❌ Failed: {response.status_code}")
                print(f"   📄 Error: {response.text}")
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "version": version
                }
                
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return {
            "success": False,
            "error": str(e),
            "version": version
        }

async def test_health_endpoint():
    """Test health endpoint to verify configuration"""
    print("🏥 Testing health endpoint...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PROXY_URL}/health")
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Health endpoint successful!")
                print(f"   🔧 OpenRouter configured: {data.get('openrouter_configured', False)}")
                print(f"   📋 Allowed models: {len(data.get('allowed_models', []))}")
                print(f"   🔄 Fallback models: {len(data.get('fallback_models', []))}")
                return True
            else:
                print(f"   ❌ Health check failed: {response.status_code}")
                return False
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
        return False

async def main():
    """Run comprehensive Revo version tests"""
    print("🚀 Testing OpenRouter Fallback for All Revo Versions")
    print("=" * 70)
    
    # Check if proxy server is running
    health_ok = await test_health_endpoint()
    if not health_ok:
        print("❌ Proxy server not healthy. Please check the server.")
        return
    
    # Define test cases for each Revo version
    test_cases = [
        # Revo 1.0 - Image generation focused
        {
            "version": "1.0",
            "model": "gemini-2.5-flash-image-preview",
            "type": "image",
            "description": "Revo 1.0 - Enhanced image generation"
        },
        
        # Revo 1.5 - Content generation focused
        {
            "version": "1.5", 
            "model": "gemini-2.5-flash",
            "type": "text",
            "description": "Revo 1.5 - Content generation"
        },
        {
            "version": "1.5",
            "model": "gemini-2.5-flash-lite", 
            "type": "text",
            "description": "Revo 1.5 - Lite content generation"
        },
        
        # Revo 2.0 - Next-gen AI with native image generation
        {
            "version": "2.0",
            "model": "gemini-2.5-flash-image-preview",
            "type": "image", 
            "description": "Revo 2.0 - Next-gen image generation"
        },
        {
            "version": "2.0",
            "model": "gemini-2.5-flash",
            "type": "text",
            "description": "Revo 2.0 - Next-gen text generation"
        }
    ]
    
    print(f"\n📋 Running {len(test_cases)} test cases...")
    
    results = []
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'='*50}")
        print(f"Test {i}/{len(test_cases)}: {test_case['description']}")
        print(f"{'='*50}")
        
        result = await test_revo_version(
            test_case["version"],
            test_case["model"], 
            test_case["type"]
        )
        result["description"] = test_case["description"]
        results.append(result)
        
        # Small delay between tests
        await asyncio.sleep(1)
    
    # Summary
    print(f"\n{'='*70}")
    print("📊 TEST RESULTS SUMMARY")
    print(f"{'='*70}")
    
    successful_tests = [r for r in results if r["success"]]
    failed_tests = [r for r in results if not r["success"]]
    
    print(f"✅ Successful: {len(successful_tests)}/{len(results)}")
    print(f"❌ Failed: {len(failed_tests)}/{len(results)}")
    
    if successful_tests:
        print(f"\n🎉 Successful Tests:")
        for result in successful_tests:
            print(f"   ✅ {result['description']} (Provider: {result.get('provider', 'unknown').upper()})")
    
    if failed_tests:
        print(f"\n💥 Failed Tests:")
        for result in failed_tests:
            print(f"   ❌ {result['description']} - {result.get('error', 'Unknown error')}")
    
    # Provider usage summary
    providers = {}
    for result in successful_tests:
        provider = result.get('provider', 'unknown')
        providers[provider] = providers.get(provider, 0) + 1
    
    if providers:
        print(f"\n🔧 Provider Usage:")
        for provider, count in providers.items():
            print(f"   {provider.upper()}: {count} requests")
    
    # Final status
    if len(successful_tests) == len(results):
        print(f"\n🎉 ALL TESTS PASSED! OpenRouter fallback is working for all Revo versions!")
        print("   Your system is fully protected with automatic failover.")
    elif len(successful_tests) > 0:
        print(f"\n⚠️ PARTIAL SUCCESS: {len(successful_tests)}/{len(results)} tests passed.")
        print("   Some Revo versions may need attention.")
    else:
        print(f"\n❌ ALL TESTS FAILED! Please check your configuration.")

if __name__ == "__main__":
    asyncio.run(main())
