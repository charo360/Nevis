#!/usr/bin/env python3
"""
Demo script showing OpenRouter fallback system in action
"""

import asyncio
import httpx
import json
import time
from datetime import datetime

PROXY_URL = "http://localhost:8000"

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"🎯 {title}")
    print("=" * 60)

def print_response(response_data, request_type):
    """Print formatted response data"""
    if response_data.get('success'):
        provider = response_data.get('provider_used', 'unknown')
        model = response_data.get('model_used', 'unknown')
        credits = response_data.get('user_credits', 'unknown')
        
        print(f"✅ {request_type} successful!")
        print(f"   🔧 Provider: {provider.upper()}")
        print(f"   🤖 Model: {model}")
        print(f"   💳 Credits remaining: {credits}")
        
        # Show response preview
        data = response_data.get('data', {})
        if 'candidates' in data and data['candidates']:
            content = data['candidates'][0].get('content', {})
            parts = content.get('parts', [])
            if parts and 'text' in parts[0]:
                text = parts[0]['text'][:150]
                print(f"   📝 Response: {text}...")
        
        return provider
    else:
        print(f"❌ {request_type} failed!")
        return None

async def demo_text_generation():
    """Demo text generation with potential fallback"""
    print_header("Text Generation Demo")
    
    requests = [
        {
            "prompt": "Write a short greeting message for a business app.",
            "model": "gemini-2.5-flash",
            "user_id": "demo_user_1"
        },
        {
            "prompt": "Explain what AI proxy servers do in one sentence.",
            "model": "gemini-2.5-flash-lite", 
            "user_id": "demo_user_2"
        },
        {
            "prompt": "Generate a professional email subject line about API updates.",
            "model": "gemini-2.5-flash",
            "user_id": "demo_user_3"
        }
    ]
    
    providers_used = []
    
    for i, req in enumerate(requests, 1):
        print(f"\n📤 Request {i}: {req['prompt'][:50]}...")
        print(f"   Model: {req['model']}")
        
        payload = {
            "prompt": req["prompt"],
            "user_id": req["user_id"],
            "user_tier": "free",
            "model": req["model"],
            "max_tokens": 150,
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                start_time = time.time()
                response = await client.post(f"{PROXY_URL}/generate-text", json=payload)
                end_time = time.time()
                
                if response.status_code == 200:
                    data = response.json()
                    provider = print_response(data, "Text generation")
                    providers_used.append(provider)
                    print(f"   ⏱️ Response time: {end_time - start_time:.2f}s")
                else:
                    print(f"❌ Request failed: {response.status_code}")
                    print(f"   Error: {response.text}")
                    
            except Exception as e:
                print(f"❌ Request error: {e}")
        
        # Small delay between requests
        await asyncio.sleep(1)
    
    return providers_used

async def demo_image_generation():
    """Demo image generation with potential fallback"""
    print_header("Image Generation Demo")
    
    requests = [
        {
            "prompt": "Create a simple logo with blue background and white text saying 'DEMO'",
            "user_id": "demo_img_user_1"
        },
        {
            "prompt": "Generate a minimalist icon for a business application",
            "user_id": "demo_img_user_2"
        }
    ]
    
    providers_used = []
    
    for i, req in enumerate(requests, 1):
        print(f"\n🖼️ Image Request {i}: {req['prompt'][:50]}...")
        
        payload = {
            "prompt": req["prompt"],
            "user_id": req["user_id"],
            "user_tier": "free",
            "model": "gemini-2.5-flash-image-preview",
            "max_tokens": 1024,
            "temperature": 0.8
        }
        
        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                start_time = time.time()
                response = await client.post(f"{PROXY_URL}/generate-image", json=payload)
                end_time = time.time()
                
                if response.status_code == 200:
                    data = response.json()
                    provider = print_response(data, "Image generation")
                    providers_used.append(provider)
                    print(f"   ⏱️ Response time: {end_time - start_time:.2f}s")
                else:
                    print(f"❌ Image request failed: {response.status_code}")
                    print(f"   Error: {response.text}")
                    
            except Exception as e:
                print(f"❌ Image request error: {e}")
        
        # Delay between image requests
        await asyncio.sleep(2)
    
    return providers_used

async def demo_health_check():
    """Demo health check and configuration"""
    print_header("System Health Check")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{PROXY_URL}/health")
            if response.status_code == 200:
                data = response.json()
                print("✅ Proxy server is healthy!")
                print(f"   🔧 OpenRouter configured: {data.get('openrouter_configured', False)}")
                print(f"   🤖 Allowed models: {len(data.get('allowed_models', []))}")
                print(f"   🔄 Fallback models: {len(data.get('fallback_models', []))}")
                
                # Show model mappings
                if 'fallback_models' in data:
                    print("   📋 Fallback mappings:")
                    for model in data['fallback_models'][:3]:  # Show first 3
                        print(f"      • {model}")
                
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False

async def main():
    """Run the complete demo"""
    print("🚀 OpenRouter Fallback System Demo")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check if server is running
    if not await demo_health_check():
        print("\n❌ Cannot connect to proxy server.")
        print("Please start the server with: python main.py")
        return
    
    # Run demos
    print("\n🎬 Starting demonstration...")
    
    text_providers = await demo_text_generation()
    image_providers = await demo_image_generation()
    
    # Summary
    print_header("Demo Summary")
    
    all_providers = text_providers + image_providers
    google_count = all_providers.count('google')
    openrouter_count = all_providers.count('openrouter')
    
    print(f"📊 Provider Usage Statistics:")
    print(f"   🟢 Google API: {google_count} requests")
    print(f"   🔵 OpenRouter: {openrouter_count} requests")
    print(f"   📈 Total requests: {len(all_providers)}")
    
    if openrouter_count > 0:
        print(f"\n🎉 Fallback system activated {openrouter_count} times!")
        print("   The system successfully switched to OpenRouter when needed.")
    else:
        print(f"\n✅ All requests used Google API successfully.")
        print("   Fallback system is ready but wasn't needed.")
    
    print(f"\n🏁 Demo completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("   Check the server logs to see detailed fallback behavior.")

if __name__ == "__main__":
    asyncio.run(main())
