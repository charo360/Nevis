# Check OpenAI Usage & Billing

## Step 1: Check Current Usage
1. Go to: https://platform.openai.com/usage
2. Look at today's usage
3. You should see API calls for:
   - `gpt-4o-mini` (your assistants)
   - Thread operations
   - File operations (if using documents)

## Step 2: Check Credits
1. Go to: https://platform.openai.com/settings/organization/billing/overview
2. Check if you have free credits remaining
3. Look for "Free trial credits" or "Granted credits"

## Step 3: Check Billing
1. Go to: https://platform.openai.com/settings/organization/billing
2. Verify payment method is added
3. Check "Payment history" for past charges

## Typical Assistant Costs (GPT-4o-mini):
- **Input**: $0.150 per 1M tokens (~$0.0001 per request)
- **Output**: $0.600 per 1M tokens (~$0.0005 per response)
- **Single generation**: ~$0.01-0.05
- **100 generations**: ~$1-5

## What to Expect:
- If you have **free credits**: No charge until credits run out
- If no payment method: Limited to free tier
- If payment method added: Billed at end of month
- Charges appear as "OpenAI" on credit card

## Debug Your Account:
Run this to see what model is being used:
```
Check the logs for: "✅ [Assistant Manager] Using finance assistant: asst_..."
This confirms the assistant is running
```

Look for usage at: https://platform.openai.com/usage
Filter by today's date to see real-time usage.
