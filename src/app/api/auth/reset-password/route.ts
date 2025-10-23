import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { resetToken, newPassword, confirmPassword } = await request.json();

    if (!resetToken || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Verify reset token is valid and not used
    const { data: resetCodes, error: fetchError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('id', resetToken)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (fetchError) {
      console.error('Error fetching reset code:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify reset token' },
        { status: 500 }
      );
    }

    if (!resetCodes || resetCodes.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const resetCode = resetCodes[0];

    // Update user password using Supabase Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetCode.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Mark reset code as used
    await supabase
      .from('password_reset_codes')
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('id', resetToken);

    // Invalidate all other reset codes for this user
    await supabase
      .from('password_reset_codes')
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('user_id', resetCode.user_id)
      .eq('used', false);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}


