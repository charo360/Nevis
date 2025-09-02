const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
const SENDGRID_FROM = process.env.SENDGRID_FROM || 'no-reply@nevis.app'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@nevis.app'

export default async function sendEmail(to: string, subject: string, html: string, text?: string) {
  if (!SENDGRID_API_KEY) {
    return
  }

  const payload: any = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: SENDGRID_FROM, name: 'Nevis' },
    reply_to: { email: SUPPORT_EMAIL, name: 'Nevis Support' },
    subject,
    content: text ? [{ type: 'text/plain', value: text }, { type: 'text/html', value: html }] : [{ type: 'text/html', value: html }],
    headers: { 'List-Unsubscribe': `<mailto:${SUPPORT_EMAIL}>` }
  }

  const enableSandbox = process.env.SENDGRID_SANDBOX === 'true'
  if (enableSandbox) payload.mail_settings = { sandbox_mode: { enable: true } }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const body = await res.text()
  }
}
