#!/bin/bash

echo "🚀 Setting up Forgot Password System..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from example..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local - Please add your SENDGRID_API_KEY"
    echo ""
fi

# Check if SendGrid API key is set
if grep -q "your_sendgrid_api_key_here" .env.local 2>/dev/null; then
    echo "⚠️  SENDGRID_API_KEY not configured in .env.local"
    echo "   Please add your SendGrid API key to continue"
    echo ""
    echo "   Get your API key from: https://app.sendgrid.com/settings/api_keys"
    echo ""
fi

echo "📋 Next Steps:"
echo ""
echo "1. Add SENDGRID_API_KEY to .env.local"
echo "   - Sign up at https://sendgrid.com"
echo "   - Create API key with 'Mail Send' permissions"
echo "   - Add to .env.local"
echo ""
echo "2. Run database migration:"
echo "   - Option A (Supabase CLI): supabase db push"
echo "   - Option B (Dashboard): Copy/paste SQL from supabase/migrations/create_password_reset_codes.sql"
echo ""
echo "3. Test the flow:"
echo "   - Visit /auth"
echo "   - Click 'Forgot password?'"
echo "   - Enter your email"
echo "   - Check your inbox for the 6-digit code"
echo ""
echo "✅ Setup script complete!"
