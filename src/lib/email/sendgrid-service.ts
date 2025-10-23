/**
 * SendGrid Email Service
 * Handles sending transactional emails via SendGrid API
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  emailType?: 'password_reset' | 'payment_confirmation';
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send email using SendGrid API
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not configured');
    return {
      success: false,
      error: 'Email service not configured'
    };
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@crevo.app';
  const fromName = process.env.SENDGRID_FROM_NAME || 'Crevo AI';

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }],
            subject: options.subject
          }
        ],
        from: {
          email: fromEmail,
          name: fromName
        },
        reply_to: {
          email: 'support@crevo.app',
          name: 'Crevo AI Support'
        },
        content: [
          {
            type: 'text/plain',
            value: options.text
          },
          {
            type: 'text/html',
            value: options.html
          }
        ],
        headers: {
          'X-Mailer': 'Crevo AI Email System',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal'
        },
        categories: [options.emailType === 'payment_confirmation' ? 'payment-confirmation' : 'password-reset', 'transactional'],
        custom_args: {
          'email_type': options.emailType || 'password_reset',
          'system': 'crevo_ai'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ SendGrid API error:', error);
      return {
        success: false,
        error: 'Failed to send email'
      };
    }

    // SendGrid returns 202 Accepted with message ID in header
    const messageId = response.headers.get('x-message-id');

    return {
      success: true,
      messageId: messageId || undefined
    };
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate payment confirmation email HTML
 */
export function generatePaymentConfirmationEmail(paymentData: {
  customerName: string;
  planName: string;
  amount: number;
  currency: string;
  creditsAdded: number;
  totalCredits: number;
  transactionId: string;
  paymentDate: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation - Crevo AI</title>
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
</head>
<body style="font-family: Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 20px; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
    
    <!-- Header -->
    <div style="background-color: #10b981; padding: 30px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Crevo AI</h1>
      <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px;">Payment Confirmation</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.5;">
        Hello ${paymentData.customerName},
      </p>
      
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.5;">
        Thank you for your purchase! Your payment has been successfully processed and your credits have been added to your account.
      </p>
      
      <!-- Payment Details Box -->
      <div style="background-color: #f8fafc; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">Payment Details</h3>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280; font-size: 14px;">Plan:</span>
          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${paymentData.planName}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280; font-size: 14px;">Amount:</span>
          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${paymentData.currency.toUpperCase()} ${paymentData.amount.toFixed(2)}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280; font-size: 14px;">Credits Added:</span>
          <span style="color: #10b981; font-size: 14px; font-weight: 600;">+${paymentData.creditsAdded}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280; font-size: 14px;">Total Credits:</span>
          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${paymentData.totalCredits}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280; font-size: 14px;">Date:</span>
          <span style="color: #6b7280; font-size: 14px;">${paymentData.paymentDate}</span>
        </div>
      </div>
      
      <!-- Credits Info -->
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; font-weight: 600;">
          🎉 Your credits are now active!
        </p>
        <p style="margin: 0; color: #047857; font-size: 13px;">
          You can start generating AI content immediately. Credits never expire and can be used across all our AI models.
        </p>
      </div>
      
      <!-- Next Steps -->
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">
          What's Next?
        </p>
        <ul style="margin: 0; color: #1e3a8a; font-size: 13px; padding-left: 20px;">
          <li>Visit your dashboard to start creating content</li>
          <li>Explore different AI models (Revo 1.0, 1.5, 2.0)</li>
          <li>Check your credit balance anytime in settings</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crevo.app'}/dashboard" 
           style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
          Go to Dashboard
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px; text-align: center;">
      <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
        Need help? Contact us at <a href="mailto:support@crevo.app" style="color: #3b82f6; text-decoration: none;">support@crevo.app</a>
      </p>
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} Crevo AI. All rights reserved.
      </p>
    </div>
    
  </div>
</body>
</html>
  `;

  const text = `
Payment Confirmation - Crevo AI

Hello ${paymentData.customerName},

Thank you for your purchase! Your payment has been successfully processed and your credits have been added to your account.

Payment Details:
- Plan: ${paymentData.planName}
- Amount: ${paymentData.currency.toUpperCase()} ${paymentData.amount.toFixed(2)}
- Credits Added: +${paymentData.creditsAdded}
- Total Credits: ${paymentData.totalCredits}
- Date: ${paymentData.paymentDate}

🎉 Your credits are now active! You can start generating AI content immediately. Credits never expire and can be used across all our AI models.

What's Next?
- Visit your dashboard to start creating content
- Explore different AI models (Revo 1.0, 1.5, 2.0)
- Check your credit balance anytime in settings

Go to Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://crevo.app'}/dashboard

Need help? Contact us at support@crevo.app

© ${new Date().getFullYear()} Crevo AI. All rights reserved.
  `;

  return { html, text };
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(paymentData: {
  customerEmail: string;
  customerName: string;
  planName: string;
  amount: number;
  currency: string;
  creditsAdded: number;
  totalCredits: number;
  transactionId: string;
  paymentDate: string;
}): Promise<SendEmailResult> {
  const { html, text } = generatePaymentConfirmationEmail(paymentData);
  
  return await sendEmail({
    to: paymentData.customerEmail,
    subject: `Payment Confirmation - ${paymentData.planName} - Crevo AI`,
    html,
    text,
    emailType: 'payment_confirmation'
  });
}

/**
 * Generate reset password email HTML
 */
export function generateResetPasswordEmail(code: string, expiresMinutes: number = 15) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Crevo AI</title>
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
</head>
<body style="font-family: Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 20px; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
    
    <!-- Header -->
    <div style="background-color: #3b82f6; padding: 30px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Crevo AI</h1>
      <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px;">Password Reset Request</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.5;">
        Hello,
      </p>
      
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.5;">
        We received a request to reset your password for your Crevo AI account. Use the verification code below to proceed:
      </p>
      
      <!-- Code Box -->
      <div style="background-color: #f8fafc; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
        <p style="margin: 0; color: #1f2937; font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">${code}</p>
      </div>
      
      <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
        This code will expire in <strong>${expiresMinutes} minutes</strong>. If you didn't request this password reset, please ignore this email.
      </p>
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px; font-weight: 600;">
          Security Tip: Never share this code with anyone. Crevo AI will never ask for your verification code.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px; text-align: center;">
      <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
        Need help? Contact us at <a href="mailto:support@crevo.app" style="color: #3b82f6; text-decoration: none;">support@crevo.app</a>
      </p>
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} Crevo AI. All rights reserved.
      </p>
    </div>
    
  </div>
</body>
</html>
  `;

  const text = `
Reset Your Password

We received a request to reset your password for your Crevo AI account.

Verification Code: ${code}

This code will expire in ${expiresMinutes} minutes.

If you didn't request this password reset, please ignore this email or contact support if you have concerns.

Security Tip: Never share this code with anyone. Crevo will never ask for your verification code.

Need help? Contact us at support@crevo.app

© ${new Date().getFullYear()} Crevo AI. All rights reserved.
  `;

  return { html, text };
}


