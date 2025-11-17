'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        

          <p className="text-gray-700 mb-8">
            Welcome to Crevo! These Terms of Service ("Terms") govern your use of our AI-powered
            content creation platform. By accessing or using Crevo, you agree to be bound by these Terms.
            If you do not agree to these Terms, please do not use our service.
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By creating an account or using Crevo, you acknowledge that you have read, understood,
              and agree to be bound by these Terms and our Privacy Policy.
            </p>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Eligibility Requirements:</h3>
            <ul className="list-disc pl-6 text-gray-700">
              <li>You must be at least 18 years old to use our service</li>
              <li>You must not be located in a country subject to U.S. trade sanctions</li>
              <li>You must provide accurate and complete registration information</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              Crevo is an AI-powered platform that generates social media content from user prompts using a credit-based system.
              Our service includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>AI-generated text, images, and multimedia content</li>
              <li>Content customization and editing tools</li>
              <li>Social media optimization features</li>
              <li>Analytics and performance tracking</li>
              <li>Credit-based usage system with transparent pricing</li>
              <li>Free credits for new users to test the platform</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Service Availability:</strong> We provide our service "as is" and may modify,
              suspend, or discontinue features at any time. We do not guarantee uninterrupted service.
            </p>
            <p className="text-gray-700">
              <strong>AI Limitations:</strong> Our AI outputs may not be perfect, error-free, or suitable
              for all purposes. Generated content should be reviewed before use.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">3. User Accounts and Responsibilities</h2>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Account Requirements:</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Maintain accurate and up-to-date account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-4">Prohibited Activities:</h3>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Generate content that infringes on third-party rights</li>
              <li>Create harmful, offensive, or discriminatory content</li>
              <li>Attempt to reverse-engineer or copy our AI technology</li>
              <li>Share your account credentials with others</li>
              <li>Use automated tools to access the service without permission</li>
              <li>Upload malware or attempt to compromise our systems</li>
            </ul>

            <p className="text-gray-700">
              <strong>Content Responsibility:</strong> You are solely responsible for all content you
              generate using our service. We do not endorse or guarantee the accuracy, legality, or
              suitability of generated content.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">4. Intellectual Property</h2>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Your Content:</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>You retain ownership of the content you generate</li>
              <li>You grant us a license to process your inputs for service provision</li>
              <li>You are responsible for ensuring your inputs don't infringe third-party rights</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-4">Our Intellectual Property:</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Crevo's technology, algorithms, and platform remain our exclusive property</li>
              <li>You may not copy, modify, or distribute our proprietary technology</li>
              <li>We grant you a limited, non-exclusive license to use our service</li>
            </ul>

            <p className="text-gray-700">
              <strong>AI Training Data:</strong> We may use aggregated and anonymized data from user
              interactions to improve our AI models. This data is processed to remove personally
              identifiable information.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">5. Credit-Based System and Payments</h2>

            <h3 className="text-xl font-medium text-gray-800 mb-4">Credit System:</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Crevo operates on a credit-based system where each content generation consumes credits</li>
              <li>Credits are purchased in packages and do not expire</li>
              <li>Different content types may consume different amounts of credits</li>
              <li>You can view your credit balance in your account dashboard</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-4">Free Credits and Trial:</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>New users receive free credits to test and experience our platform</li>
              <li>Free credits allow you to explore all features before making a purchase</li>
              <li>Free credits are provided to help you understand the value of our service</li>
              <li>Additional free credits may be provided through promotions or referrals</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-4">Payment and Refund Policy:</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>All credit purchases are final and non-refundable</strong></li>
              <li>Since we provide free credits for testing, all paid purchases are considered final</li>
              <li>Credits are delivered instantly upon successful payment</li>
              <li>Payment is processed securely through our payment partners</li>
              <li>We do not offer refunds, exchanges, or credits for unused credits</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-4">Credit Usage:</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Credits are deducted only when content is successfully generated</li>
              <li>Failed generations due to system errors will not consume credits</li>
              <li>Credits are non-transferable between accounts</li>
              <li>Credit consumption rates are displayed before generation</li>
            </ul>

            <p className="text-gray-700">
              <strong>Price Changes:</strong> We may change credit package prices with 30 days notice.
              Price changes will not affect credits already purchased.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">6. Limitations of Liability and Disclaimers</h2>
            <p className="text-gray-700 mb-4">
              <strong>Service Disclaimers:</strong> Crevo is provided "as is" without warranties of any kind.
              We do not guarantee that the service will be error-free, secure, or meet your requirements.
            </p>

            <p className="text-gray-700 mb-4">
              <strong>AI Content Disclaimer:</strong> AI-generated content may contain inaccuracies,
              biases, or inappropriate material. You use generated content at your own risk and should
              always review and verify content before publication.
            </p>

            <p className="text-gray-700 mb-4">
              <strong>Liability Limitations:</strong> To the maximum extent permitted by law, our total
              liability for any claims arising from your use of the service shall not exceed the amount
              you paid us in the 12 months preceding the claim.
            </p>

            <p className="text-gray-700 mb-4">
              <strong>Third-Party Services:</strong> We are not responsible for third-party services
              integrated with our platform, including payment processors or AI providers.
            </p>

            <p className="text-gray-700">
              <strong>No Refund Policy:</strong> Given that we provide free credits for users to test and
              evaluate our service before purchase, all credit purchases are considered final. We do not
              provide refunds, exchanges, or credits for any reason after purchase completion. This policy
              ensures fair usage as users have the opportunity to fully test our platform before committing
              to a purchase.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">7. Termination</h2>
            <p className="text-gray-700 mb-4">
              <strong>Termination by You:</strong> You may stop using our service at any time.
              To delete your account, contact us at{' '}
              <a href="mailto:sam@crevo.app" className="text-blue-600 hover:underline">
                sam@crevo.app
              </a>
            </p>

            <p className="text-gray-700 mb-4">
              <strong>Termination by Us:</strong> We may suspend or terminate your account for violations
              of these Terms, illegal activity, or at our discretion.
            </p>

            <p className="text-gray-700">
              <strong>Post-Termination:</strong> Upon termination, your right to use the service ends
              immediately. We will delete your personal data in accordance with our Privacy Policy,
              except as required to comply with legal obligations.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">8. Governing Law and Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              <strong>Governing Law:</strong> These Terms are governed by the laws of Delaware,
              United States, without regard to conflict of law principles.
            </p>

            <p className="text-gray-700 mb-4">
              <strong>Dispute Resolution:</strong> Any disputes arising from these Terms shall be
              resolved through binding arbitration in accordance with the rules of the American
              Arbitration Association. You waive your right to participate in class action lawsuits.
            </p>

            <p className="text-gray-700">
              <strong>Severability:</strong> If any provision of these Terms is found invalid, the
              remaining provisions will remain in full force and effect.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">9. Changes to Terms</h2>
            <p className="text-gray-700">
              We may update these Terms from time to time. We will notify you of material changes
              via email or through our platform. Your continued use of the service after changes
              become effective constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">10. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a href="mailto:sam@crevo.app" className="text-blue-600 hover:underline">
                  sam@crevo.app
                </a>
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Subject:</strong> Terms of Service Inquiry
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}