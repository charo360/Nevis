'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        

          <p className="text-gray-700 mb-8">
            At Crevo, we respect your privacy and are committed to protecting your personal information.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you use our AI-powered content creation platform.
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">1. Information We Collect</h2>

            <h3 className="text-xl font-medium text-gray-800 mb-4">Personal Information</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>Account information (name, email address) when you create an account</li>
              <li>Payment information processed through secure third-party providers</li>
              <li>Profile information you choose to provide</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-4">Usage Information</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>Prompts and inputs you provide to generate content</li>
              <li>Generated outputs and usage patterns</li>
              <li>IP address, browser type, and device information</li>
              <li>Pages visited and features used on our platform</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-4">AI-Specific Data</h3>
            <p className="text-gray-700 mb-4">
              To improve our AI models and service quality, we may retain anonymized and aggregated
              data from user interactions. This data is processed to remove personally identifiable
              information and used solely for service enhancement.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Provide and maintain our AI content generation services</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important service updates and communications</li>
              <li>Improve our AI models through aggregated, anonymized data analysis</li>
              <li>Prevent abuse and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">3. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share
              your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>With service providers who assist in operating our platform (under strict confidentiality agreements)</li>
              <li>With AI service providers to process your content generation requests</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">4. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies to enhance your experience and analyze usage patterns.
            </p>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Types of Cookies:</h3>
            <ul className="list-disc pl-6 text-gray-700">
              <li><strong>Essential cookies:</strong> Required for basic platform functionality</li>
              <li><strong>Analytics cookies:</strong> Help us understand how users interact with our service</li>
              <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
            </ul>
            <p className="text-gray-700 mt-4">
              You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and employee training</li>
              <li>Secure third-party payment processing</li>
            </ul>
            <p className="text-gray-700 mt-4">
              While we strive to protect your data, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your information for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Account data: Retained while your account is active and for 2 years after deactivation</li>
              <li>Usage data: Anonymized and aggregated for service improvement</li>
              <li>Payment data: Handled by secure third-party processors according to their policies</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">7. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us at{' '}
              <a href="mailto:sam@crevo.app" className="text-blue-600 hover:underline">
                sam@crevo.app
              </a>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">8. Children's Privacy</h2>
            <p className="text-gray-700">
              Our service is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If we become aware that we have collected
              personal information from a child under 13, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">9. International Data Transfers</h2>
            <p className="text-gray-700">
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place to protect your data during such transfers.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any material
              changes by posting the new policy on this page and updating the effective date.
              Your continued use of our service after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">11. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a href="mailto:sam@crevo.app" className="text-blue-600 hover:underline">
                  sam@crevo.app
                </a>
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Subject:</strong> Privacy Policy Inquiry
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}