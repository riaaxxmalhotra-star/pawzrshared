import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Pawzr',
  description: 'Privacy Policy for Pawzr - Connect Pet Owners with Pet Lovers',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-500">Last updated: January 14, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p>
                Welcome to Pawzr. Pawzr is a platform that connects pet owners with pet lovers — people who love pets but may not have their own. We are committed to protecting your privacy and ensuring the security of your personal information.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website. By using Pawzr, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">2.1 Information You Provide</h3>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Phone number (for SMS OTP authentication), name, and profile photo.</li>
                <li><strong>User Type:</strong> Whether you are a Pet Owner or a Pet Lover.</li>
                <li><strong>Pet Information (for Pet Owners):</strong> Pet names, species, breed, age, photos, and personality traits.</li>
                <li><strong>Profile Information (for Pet Lovers):</strong> Your preferences, experience with pets, and interests.</li>
                <li><strong>Messages:</strong> Communications exchanged with other users through our platform.</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">2.2 Automatically Collected Information</h3>
              <p>When you use Pawzr, we automatically collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device information (device type, operating system, unique device identifiers)</li>
                <li>Log information (access times, pages viewed, app interactions)</li>
                <li>IP address</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p>We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Provide Our Service:</strong> Connect pet owners with pet lovers based on preferences and compatibility.</li>
                <li><strong>Authentication:</strong> Verify your identity through Firebase Phone Authentication via SMS OTP.</li>
                <li><strong>Enable Connections:</strong> Display your profile to potential matches and facilitate communication.</li>
                <li><strong>Improve the Platform:</strong> Analyze usage patterns to enhance user experience.</li>
                <li><strong>Communications:</strong> Send service-related notifications and updates.</li>
                <li><strong>Safety:</strong> Detect and prevent fraud, abuse, and security issues.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
              <p>We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Other Users:</strong> Your profile information (name, photo, pet details or preferences) is visible to other users to facilitate connections.</li>
                <li><strong>Service Providers:</strong> With third-party services that help us operate the platform (e.g., Firebase for authentication).</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
              </ul>
              <p className="mt-4">We do not sell your personal information to third parties.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information, including encryption of data in transit, secure authentication through Firebase, and regular security assessments. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request access to your personal data.</li>
                <li><strong>Correction:</strong> Update or correct your profile information.</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
                <li><strong>Opt-out:</strong> Unsubscribe from promotional communications.</li>
              </ul>
              <p className="mt-4">To exercise these rights, please contact us at the email address provided below.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active. When you delete your account, we will delete your personal information within 30 days, except where we are required to retain it for legal purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
              <p>
                Pawzr is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will delete such information promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Services</h2>
              <p>
                Our platform uses Firebase for authentication and analytics. These third-party services have their own privacy policies. We encourage you to review them.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Your continued use of Pawzr after changes indicates your acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p><strong>Pawzr</strong></p>
                <p>Email: support@pawzr.com</p>
                <p>Website: https://pawzrpro.vercel.app</p>
              </div>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm">© 2026 Pawzr. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
