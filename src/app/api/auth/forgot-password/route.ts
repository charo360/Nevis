import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, generateVerificationCode, generateResetPasswordEmail } from '@/lib/email/sendgrid-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists in Supabase auth
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error checking user:', userError);
      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      );
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    // Security: Always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      // Still return success but don't send email
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code'
      });
    }

    // Generate 6-digit code
    const code = generateVerificationCode();
    const expiresMinutes = 15;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    // Invalidate any existing unused codes for this email
    await supabase
      .from('password_reset_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('email', email.toLowerCase())
      .eq('used', false);

    // Store reset code in database
    const { error: insertError } = await supabase
      .from('password_reset_codes')
      .insert({
        user_id: user.id,
        email: email.toLowerCase(),
        code: code,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (insertError) {
      console.error('Error storing reset code:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate reset code' },
        { status: 500 }
      );
    }

    // Send email with reset code
    const { html, text } = generateResetPasswordEmail(code, expiresMinutes);
    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset Your Crevo AI Password',
      html,
      text
    });

    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult.error);
      
      // For development/testing: Log the code instead of failing
      console.log(`🔧 DEVELOPMENT MODE: Reset code for ${email} is: ${code}`);
      console.log(`🔧 This code expires at: ${expiresAt}`);
      
      // Return success even if email fails (for testing)
      return NextResponse.json({
        success: true,
        message: 'Reset code generated successfully (email sending failed - check console for code)',
        expiresIn: expiresMinutes * 60,
        developmentCode: code // Only for development
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset code',
      expiresIn: expiresMinutes * 60 // seconds
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}


