#!/usr/bin/env python3
"""
Test OpenRouter API directly to verify it's working
"""

import asyncio
import httpx
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env.local')

async def test_openrouter_direct():
    """Test OpenRouter API directly"""
    api_key = os.environ.get('OPENROUTER_API_KEY')
    if not api_key:
        print('❌ OPENROUTER_API_KEY not found in environment')
        return False
    
    print(f'✅ OpenRouter API key found: {api_key[:20]}...')
    
    # Test direct OpenRouter API call
    payload = {
        'model': 'google/gemini-2.5-flash',
        'messages': [
            {
                'role': 'user', 
                'content': 'Hello! Please respond with "OpenRouter is working correctly" to test the connection.'
            }
        ],
        'temperature': 0.7,
        'max_tokens': 100
    }
    
    print('🔄 Testing OpenRouter API...')
    print(f'📤 Request: {json.dumps(payload, indent=2)}')
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://nevis.ai',
                    'X-Title': 'Nevis AI Platform'
                },
                json=payload
            )
            
            print(f'📥 Response status: {response.status_code}')
            
            if response.status_code == 200:
                data = response.json()
                print(f'📝 Full response: {json.dumps(data, indent=2)}')
                
                if 'choices' in data and data['choices']:
                    content = data['choices'][0]['message']['content']
                    print(f'✅ OpenRouter API working!')
                    print(f'💬 Generated content: {content}')
                    return True
                else:
                    print('❌ No content in response')
                    return False
            else:
                print(f'❌ OpenRouter API failed: {response.status_code}')
                print(f'Error response: {response.text}')
                return False
                
        except Exception as e:
            print(f'❌ OpenRouter API error: {e}')
            return False

async def test_openrouter_image():
    """Test OpenRouter image generation"""
    api_key = os.environ.get('OPENROUTER_API_KEY')
    if not api_key:
        print('❌ OPENROUTER_API_KEY not found')
        return False
    
    print('\n🖼️ Testing OpenRouter image generation...')
    
    payload = {
        'model': 'google/gemini-2.5-flash-image-preview',
        'messages': [
            {
                'role': 'user',
                'content': 'Create a simple test image with blue background and white text saying "TEST"'
            }
        ],
        'temperature': 0.8,
        'max_tokens': 1024,
        'modalities': ['image', 'text']
    }
    
    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            response = await client.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://nevis.ai',
                    'X-Title': 'Nevis AI Platform'
                },
                json=payload
            )
            
            print(f'📥 Image response status: {response.status_code}')
            
            if response.status_code == 200:
                data = response.json()
                print('✅ OpenRouter image API working!')
                print(f'📝 Response type: {type(data)}')
                
                if 'choices' in data and data['choices']:
                    message = data['choices'][0]['message']
                    print(f'💬 Message content type: {type(message.get("content", ""))}')
                    return True
                else:
                    print('❌ No choices in image response')
                    return False
            else:
                print(f'❌ OpenRouter image API failed: {response.status_code}')
                print(f'Error: {response.text}')
                return False
                
        except Exception as e:
            print(f'❌ OpenRouter image API error: {e}')
            return False

async def test_alternative_models():
    """Test alternative models on OpenRouter"""
    api_key = os.environ.get('OPENROUTER_API_KEY')
    if not api_key:
        return False
    
    print('\n🔄 Testing alternative models...')
    
    models_to_test = [
        'anthropic/claude-3.5-sonnet',
        'google/gemini-2.5-flash-lite'
    ]
    
    for model in models_to_test:
        print(f'\n🧪 Testing model: {model}')
        
        payload = {
            'model': model,
            'messages': [
                {
                    'role': 'user',
                    'content': f'Hello from {model}! Please confirm you are working.'
                }
            ],
            'temperature': 0.7,
            'max_tokens': 50
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {api_key}',
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://nevis.ai',
                        'X-Title': 'Nevis AI Platform'
                    },
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'choices' in data and data['choices']:
                        content = data['choices'][0]['message']['content']
                        print(f'   ✅ {model}: {content[:100]}...')
                    else:
                        print(f'   ❌ {model}: No content')
                else:
                    print(f'   ❌ {model}: Failed ({response.status_code})')
                    
            except Exception as e:
                print(f'   ❌ {model}: Error ({e})')

async def main():
    """Run all OpenRouter tests"""
    print('🚀 Testing OpenRouter API Directly')
    print('=' * 50)
    
    # Test basic text generation
    text_success = await test_openrouter_direct()
    
    # Test image generation
    image_success = await test_openrouter_image()
    
    # Test alternative models
    await test_alternative_models()
    
    # Summary
    print('\n' + '=' * 50)
    print('📊 Test Results:')
    print(f'   Text Generation: {"✅ PASS" if text_success else "❌ FAIL"}')
    print(f'   Image Generation: {"✅ PASS" if image_success else "❌ FAIL"}')
    
    if text_success:
        print('\n🎉 OpenRouter is working and can generate content!')
        print('   The fallback system should work correctly.')
    else:
        print('\n⚠️ OpenRouter may have issues. Check your API key and quota.')

if __name__ == "__main__":
    asyncio.run(main())
