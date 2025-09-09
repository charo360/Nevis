import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ 
        success: false, 
        error: 'URL is required' 
      }, { status: 400 });
    }

    // Ensure URL has protocol
    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    console.log('Testing website analysis for:', validUrl);

    // Test basic fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(validUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `HTTP error! status: ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      });
    }

    const html = await response.text();
    const contentLength = html.length;
    const hasTitle = html.includes('<title>');
    const hasBody = html.includes('<body>');

    return NextResponse.json({
      success: true,
      details: {
        status: response.status,
        contentLength,
        hasTitle,
        hasBody,
        contentPreview: html.substring(0, 500) + (html.length > 500 ? '...' : ''),
        headers: Object.fromEntries(response.headers.entries())
      }
    });

  } catch (error) {
    console.error('Website analysis test error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorType: errorMessage.includes('aborted') ? 'timeout' : 
                 errorMessage.includes('CORS') ? 'cors' :
                 errorMessage.includes('fetch') ? 'network' : 'unknown'
    });
  }
}
