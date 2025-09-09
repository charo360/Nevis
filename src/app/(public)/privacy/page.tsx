export const metadata = {
  title: 'Privacy Policy – Crevo',
  description: 'Privacy Policy for Crevo (crevo.app)'
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose prose-slate dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        This Privacy Policy explains how Crevo ("we", "us") collects, uses, and
        protects information in connection with the Crevo Service.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li>Account details (e.g., email, display name).</li>
        <li>Usage data and device information for analytics and security.</li>
        <li>Business/brand data you provide to generate content.</li>
        <li>Social platform tokens when you connect accounts (stored securely to enable posting).</li>
      </ul>

      <h2>How We Use Information</h2>
      <ul>
        <li>To operate and improve the Service.</li>
        <li>To generate content and designs at your request.</li>
        <li>To connect and post to social platforms when you authorize it.</li>
        <li>To communicate with you about updates or support.</li>
      </ul>

      <h2>Data Sharing</h2>
      <p>
        We do not sell your personal information. We may share data with service
        providers (e.g., hosting, analytics, payment processing) under contracts
        that require privacy and security protections, or when required by law.
      </p>

      <h2>Security</h2>
      <p>
        We implement reasonable administrative, technical, and physical
        safeguards. No method of transmission is 100% secure.
      </p>

      <h2>Your Choices</h2>
      <ul>
        <li>You can update or delete certain information in your account.</li>
        <li>You may disconnect social accounts at any time.</li>
        <li>You may contact us to request access or deletion subject to law.</li>
      </ul>

      <h2>International Transfers</h2>
      <p>
        Your information may be processed in countries other than your own
        where our or our providers' servers are located.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this Policy. Continued use means you accept the revised
        Policy.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Contact <a href="mailto:privacy@crevo.app">privacy@crevo.app</a>.
      </p>
    </main>
  )
}

