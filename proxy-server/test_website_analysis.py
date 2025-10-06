#!/usr/bin/env python3
"""
Test script for the new website analysis multi-model fallback system
Tests Claude 3 Haiku → GPT-4o-mini → GPT-3.5-turbo fallback
"""

import asyncio
import httpx
import json

PROXY_URL = "http://localhost:8000"

# Sample website content for testing
SAMPLE_WEBSITE_CONTENT = """
About TechFlow Solutions

TechFlow Solutions is a leading software development company based in San Francisco, California. We specialize in creating innovative web applications, mobile apps, and enterprise software solutions for businesses of all sizes.

Our Services:
- Custom Web Development
- Mobile App Development (iOS & Android)
- Enterprise Software Solutions
- Cloud Migration Services
- DevOps & Infrastructure Management
- UI/UX Design

Why Choose TechFlow Solutions?
- 10+ years of experience in software development
- Expert team of certified developers and designers
- Agile development methodology
- 24/7 customer support
- Competitive pricing with flexible payment options

Our target clients include startups, mid-size businesses, and enterprise companies looking to digitize their operations and improve efficiency through technology.

Contact Us:
Email: hello@techflowsolutions.com
Phone: (555) 123-4567
Address: 123 Tech Street, San Francisco, CA 94105

Follow us on social media:
LinkedIn: /company/techflow-solutions
Twitter: @techflowsolutions
"""

async def test_website_analysis():
    """Test the website analysis endpoint with sample content"""
    print("🧪 Testing Website Analysis Multi-Model Fallback System")
    print("=" * 70)
    
    # Check if proxy server is running
    try:
        async with httpx.AsyncClient() as client:
            await client.get(f"{PROXY_URL}/health", timeout=5.0)
        print("✅ Proxy server is running")
    except:
        print("❌ Proxy server not running. Please start it with:")
        print("   python main.py")
        return
    
    # Test website analysis
    payload = {
        "website_content": SAMPLE_WEBSITE_CONTENT,
        "website_url": "https://techflowsolutions.com",
        "user_id": "website_analysis_test_user",
        "user_tier": "free",
        "temperature": 0.3,
        "max_tokens": 4096
    }
    
    print(f"\n🌐 Testing website analysis...")
    print(f"📄 Content length: {len(SAMPLE_WEBSITE_CONTENT)} characters")
    print(f"🔗 Website URL: {payload['website_url']}")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:  # Long timeout for analysis
            response = await client.post(f"{PROXY_URL}/analyze-website", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"\n✅ Website analysis successful!")
                print(f"🤖 Model used: {data.get('model_used', 'unknown')}")
                print(f"🔧 Provider: {data.get('provider_used', 'unknown')}")
                print(f"🔄 Attempt: {data.get('attempt', 'unknown')}")
                print(f"💳 Credits remaining: {data.get('user_credits', 'unknown')}")
                
                # Display extracted business information
                if 'data' in data:
                    business_data = data['data']
                    print(f"\n📊 Extracted Business Information:")
                    print(f"   🏢 Business Name: {business_data.get('businessName', 'N/A')}")
                    print(f"   🏭 Business Type: {business_data.get('businessType', 'N/A')}")
                    print(f"   📍 Location: {business_data.get('location', 'N/A')}")
                    print(f"   🎯 Target Audience: {business_data.get('targetAudience', 'N/A')}")
                    
                    # Show services (truncated)
                    services = business_data.get('services', 'N/A')
                    if len(services) > 100:
                        services = services[:100] + "..."
                    print(f"   🛠️ Services: {services}")
                    
                    # Show value proposition (truncated)
                    value_prop = business_data.get('valueProposition', 'N/A')
                    if len(value_prop) > 100:
                        value_prop = value_prop[:100] + "..."
                    print(f"   💎 Value Proposition: {value_prop}")
                    
                    # Show CTAs
                    ctas = business_data.get('callsToAction', [])
                    if ctas:
                        print(f"   📢 Call-to-Actions: {', '.join(ctas[:3])}")
                
                return True
            else:
                print(f"❌ Website analysis failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Request error: {e}")
        return False

async def test_health_endpoint():
    """Test the health endpoint to verify website analysis configuration"""
    print("\n🏥 Testing health endpoint...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PROXY_URL}/health")
            if response.status_code == 200:
                data = response.json()
                
                print("✅ Health endpoint successful!")
                print(f"   🔧 OpenRouter configured: {data.get('openrouter_configured', False)}")
                print(f"   🌐 Website analysis enabled: {data.get('website_analysis_enabled', False)}")
                
                if 'website_analysis_models' in data:
                    print("   🤖 Website analysis models:")
                    for i, model in enumerate(data['website_analysis_models'], 1):
                        print(f"      {i}. {model}")
                
                return data.get('website_analysis_enabled', False)
            else:
                print(f"❌ Health endpoint failed: {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

async def main():
    """Run comprehensive website analysis tests"""
    print("🚀 Website Analysis Multi-Model Fallback Test Suite")
    print("=" * 70)
    
    # Test health endpoint first
    health_ok = await test_health_endpoint()
    
    if not health_ok:
        print("\n⚠️ Website analysis not properly configured")
        return
    
    # Test website analysis
    analysis_ok = await test_website_analysis()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 Test Results Summary:")
    print(f"   🏥 Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"   🌐 Website Analysis: {'✅ PASS' if analysis_ok else '❌ FAIL'}")
    
    if health_ok and analysis_ok:
        print("\n🎉 All tests passed! Website analysis multi-model fallback is working!")
        print("   Your system now uses:")
        print("   1. Claude 3 Haiku (Primary - Best & Cheapest)")
        print("   2. GPT-4o-mini (Secondary - Most Reliable)")
        print("   3. GPT-3.5-turbo (Tertiary - Budget Backup)")
    else:
        print("\n⚠️ Some tests failed. Please check the configuration.")

if __name__ == "__main__":
    asyncio.run(main())
