# Claude API Setup Guide

## 🔑 Getting Your Claude API Key

1. **Visit Anthropic Console**: Go to https://console.anthropic.com/
2. **Sign up/Login**: Create an account or log in
3. **Get API Key**: Navigate to "API Keys" section and create a new key
4. **Copy the Key**: It will look like: `sk-ant-api03-...`

## 📝 Adding to Your Environment

### Option 1: Add to .env.local file
Open your `.env.local` file and add this line:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### Option 2: Set via PowerShell (temporary)
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-api03-your-actual-key-here"
```

### Option 3: Set via Command Prompt (temporary)
```cmd
set ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

## 🧪 Testing the Setup

After adding the API key, run:
```bash
node test-claude-simple.js
```

## 💰 API Costs (Approximate)

- **Claude 3.5 Sonnet**: $3 per million input tokens, $15 per million output tokens
- **Typical Revo 2.0 generation**: ~500 input + 200 output tokens = ~$0.004 per generation
- **1000 generations**: ~$4.00

## 🚀 Next Steps

Once Claude API is working:
1. Run `node test-claude-simple.js` to verify connectivity
2. Run `node test-revo2-claude.js` to test full Revo 2.0 integration
3. Start using Revo 2.0 Claude Edition in production!

## 🔧 Troubleshooting

- **"API key not found"**: Make sure it's in .env.local and restart your server
- **"Rate limit exceeded"**: Wait a few minutes or check your usage
- **"Invalid API key"**: Verify the key is correct and active
- **"Insufficient quota"**: Add credits to your Anthropic account
