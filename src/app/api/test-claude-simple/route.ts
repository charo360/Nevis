/**
 * Simple Claude test API route using direct fetch
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    console.log(`🔍 Testing Claude with: ${websiteUrl}`);

    // Step 1: Fetch website content
    const websiteResponse = await fetch(websiteUrl);
    if (!websiteResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch website' }, { status: 400 });
    }

    const html = await websiteResponse.text();
    console.log(`📄 Website HTML length: ${html.length}`);

    // Step 2: Extract basic content
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'No title';
    const bodyText = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                         .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                         .replace(/<[^>]+>/g, ' ')
                         .replace(/\s+/g, ' ')
                         .trim()
                         .substring(0, 3000); // Limit content

    console.log(`📝 Extracted title: ${title}`);
    console.log(`📝 Body text length: ${bodyText.length}`);

    // Step 3: Call Claude API directly
    const prompt = `Analyze this website and extract products/services in JSON format.

Website: ${websiteUrl}
Title: ${title}
Content: ${bodyText}

For retail/e-commerce sites, focus on actual product categories (like "Smartphones", "Laptops") not marketing slogans.

Return JSON in this format:
{
  "business_name": "string",
  "business_type": "string", 
  "products_or_services": ["string"],
  "description": "string"
}

JSON Response:`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API Error:', errorText);
      return NextResponse.json({ error: 'Claude API failed', details: errorText }, { status: 500 });
    }

    const claudeResult = await claudeResponse.json();
    console.log('✅ Claude responded successfully');

    // Extract the text response
    const responseText = claudeResult.content?.[0]?.text || '';
    console.log('📝 Claude response:', responseText);

    // Try to parse JSON from response
    let parsedData = null;
    try {
      // Clean up the response text
      let cleanText = responseText.trim();
      if (cleanText.includes('```json')) {
        cleanText = cleanText.split('```json')[1].split('```')[0].trim();
      } else if (cleanText.includes('```')) {
        cleanText = cleanText.split('```')[1].split('```')[0].trim();
      }
      
      parsedData = JSON.parse(cleanText);
      console.log('✅ Successfully parsed JSON:', parsedData);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw response text:', responseText);
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      raw_response: responseText,
      url: websiteUrl,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Test Claude API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
