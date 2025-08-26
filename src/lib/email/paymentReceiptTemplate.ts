export function paymentReceiptHTML(opts: { planName: string; amount: number; currency: string; credits: number; sessionId: string }) {
  const { planName, amount, currency, credits, sessionId } = opts
  return `
  <div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111">
    <h2>Payment Receipt</h2>
    <p>Thanks for your purchase — here are the details:</p>
    <ul>
      <li><strong>Plan:</strong> ${planName}</li>
      <li><strong>Amount:</strong> ${currency} ${amount.toFixed(2)}</li>
      <li><strong>Credits added:</strong> ${credits}</li>
      <li><strong>Transaction:</strong> ${sessionId}</li>
    </ul>
    <p>If you have questions, reply to this email or contact support.</p>
  </div>
  `
}

export function paymentReceiptText(opts: { planName: string; amount: number; currency: string; credits: number; sessionId: string }) {
  const { planName, amount, currency, credits, sessionId } = opts
  return `Payment Receipt\nPlan: ${planName}\nAmount: ${currency} ${amount.toFixed(2)}\nCredits added: ${credits}\nTransaction: ${sessionId}\nIf you have questions, contact support.`
}
