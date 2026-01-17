// Debug OpenAI configuration in server context
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Check environment variable
  const apiKey = process.env.OPENAI_API_KEY;
  results.checks.envVar = {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    preview: apiKey ? `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 4)}` : 'MISSING'
  };

  if (!apiKey) {
    results.error = 'OPENAI_API_KEY not found in environment';
    return NextResponse.json(results, { status: 500 });
  }

  // Test API key validity
  try {
    const openai = new OpenAI({ apiKey, timeout: 10000 });
    
    // Test models list
    const models = await openai.models.list();
    results.checks.modelsAccess = {
      success: true,
      count: models.data.length
    };

    // Test GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Say OK' }],
      max_tokens: 5
    });
    results.checks.gpt4 = {
      success: true,
      response: completion.choices[0].message.content
    };

    // Test assistants list
    const assistants = await openai.beta.assistants.list({ limit: 5 });
    results.checks.assistants = {
      success: true,
      count: assistants.data.length,
      names: assistants.data.map(a => a.name)
    };

    results.success = true;
    results.message = 'OpenAI API is working correctly';

  } catch (error: any) {
    results.success = false;
    results.error = error.message;
    results.errorCode = error.status;
    
    if (error.status === 401) {
      results.diagnosis = 'API key is invalid or expired';
    } else if (error.status === 429) {
      results.diagnosis = 'Rate limit exceeded';
    } else {
      results.diagnosis = 'Unknown error - check server logs';
    }
  }

  return NextResponse.json(results);
}
