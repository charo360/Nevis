export const metadata = {
  title: 'Terms of Service – Crevo',
  description: 'Terms of Service for Crevo (crevo.app)'
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose prose-slate dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        These Terms of Service ("Terms") govern your use of Crevo (the "Service").
        By accessing or using the Service, you agree to be bound by these Terms.
      </p>

      <h2>1. Your Account</h2>
      <p>
        You are responsible for safeguarding your account credentials and for all
        activities that occur under your account. You must promptly notify us of
        any unauthorized use.
      </p>

      <h2>2. Acceptable Use</h2>
      <p>
        Do not use the Service to violate any laws, infringe intellectual
        property, or distribute harmful content. We may suspend or terminate
        access for violations.
      </p>

      <h2>3. Content & Ownership</h2>
      <p>
        You retain ownership of content you upload. By posting content, you grant
        Crevo a non-exclusive license to host and process it for the purpose of
        providing the Service.
      </p>

      <h2>4. AI-Generated Content</h2>
      <p>
        AI outputs may be imperfect. You are responsible for reviewing and using
        outputs in compliance with applicable laws and platform policies.
      </p>

      <h2>5. Payments</h2>
      <p>
        If you subscribe to paid features, you authorize us or our payment
        processor to charge you according to the displayed plan and billing
        terms.
      </p>

      <h2>6. Termination</h2>
      <p>
        We may suspend or terminate the Service with notice where feasible.
        You may stop using the Service at any time.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        The Service is provided "as is" without warranties of any kind. To the
        extent permitted by law, we disclaim implied warranties of merchantability,
        fitness for a particular purpose, and non-infringement.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Crevo will not be liable for any
        indirect, incidental, special, consequential, or punitive damages, or any
        loss of profits or revenues.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these Terms. Continued use after changes means you accept
        the revised Terms.
      </p>

      <h2>Contact</h2>
      <p>
        For questions, contact us at <a href="mailto:legal@crevo.app">legal@crevo.app</a>.
      </p>
    </main>
  )
}

