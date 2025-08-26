export function verificationEmailHTML(opts: { code: string; appName?: string; expiresMinutes?: number; supportEmail?: string }) {
  const { code, appName = 'Nevis', expiresMinutes = 15, supportEmail = 'support@nevis.app' } = opts
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${appName} Verification</title>
  </head>
  <body style="font-family: Arial, Helvetica, sans-serif; background:#f7f7fb; margin:0; padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 6px 18px rgba(15,23,42,0.08);">
            <tr style="background:linear-gradient(90deg,#4f46e5,#7c3aed);color:#fff;">
              <td style="padding:24px 28px;text-align:left;">
                <h1 style="margin:0;font-size:20px;font-weight:700;">${appName}</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.95;">Email verification</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 12px 0;color:#111827;font-size:15px;">Hi,</p>
                <p style="margin:0 0 18px 0;color:#374151;font-size:14px;">Use the code below to verify your email address. This code expires in ${expiresMinutes} minutes.</p>
                <div style="display:flex;justify-content:center;margin:18px 0;">
                  <div style="background:#f3f4f6;border-radius:8px;padding:14px 22px;font-size:28px;font-weight:700;color:#0f172a;letter-spacing:4px;">${code}</div>
                </div>
                <p style="margin:0 0 18px 0;color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email. If you believe you received this in error, contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
                <hr style="border:none;border-top:1px solid #eef2ff;margin:20px 0;" />
            
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `
}



export function verificationEmailText(opts: { code: string; appName?: string; expiresMinutes?: number; supportEmail?: string }) {
  const { code, appName = 'Nevis', expiresMinutes = 15, supportEmail = 'support@nevis.app' } = opts
  return `Your ${appName} verification code is: ${code}\nIt expires in ${expiresMinutes} minutes. If you didn't request this, ignore this email. Need help? ${supportEmail}`
}
