import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Pawzr',
  description: 'Terms of Service for Pawzr - Connect Pet Owners with Pet Lovers',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <nav className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🐾</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Pawzr</span>
          </Link>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-gray-600 hover:text-orange-500">Privacy Policy</Link>
          </div>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-500">Last updated: January 14, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Pawzr, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service. Pawzr is a platform that connects pet owners with pet lovers, veterinarians, groomers, and pet suppliers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p>Pawzr provides a mobile application that enables:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Pet Owners</strong> to find and connect with pet lovers for pet sitting, walking, and care services.</li>
                <li><strong>Pet Lovers</strong> to discover pets in their area and offer their services to pet owners.</li>
                <li><strong>Service Providers</strong> (vets, groomers, suppliers) to list their services and manage bookings.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p>To use Pawzr, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
              <p className="mt-4">You are responsible for all activities that occur under your account.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide false or misleading information</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Use the service for any illegal purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Interfere with the proper functioning of the service</li>
                <li>Create fake profiles or impersonate others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Pet Safety</h2>
              <p>
                Users are responsible for ensuring the safety and well-being of pets. Pet owners should:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate information about their pets health and behavior</li>
                <li>Ensure pets are up-to-date on vaccinations</li>
                <li>Communicate any special needs or concerns</li>
              </ul>
              <p className="mt-4">
                Pet lovers should treat all animals with care and respect, and report any concerns to pet owners immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payments and Fees</h2>
              <p>
                Pawzr may charge fees for certain services. Service providers may set their own prices for services offered through the platform. All payments are processed securely through our payment partners.
              </p>
              <p className="mt-4">
                Subscription plans (Starter, Growth, Pro) offer different commission rates and features for service providers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p>
                Pawzr is a platform that facilitates connections between users. We are not responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The actions or conduct of any user</li>
                <li>The quality of services provided by service providers</li>
                <li>Any disputes between users</li>
                <li>Any injury or damage to pets</li>
              </ul>
              <p className="mt-4">
                Users interact with each other at their own risk. We encourage users to verify identities and use our verification features.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
              <p>
                The Pawzr name, logo, and all related content are the property of Pawzr. You may not use our intellectual property without prior written consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion. You may also delete your account at any time through the app settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
              <p>
                We may update these Terms of Service from time to time. We will notify you of significant changes. Your continued use of Pawzr after changes indicates your acceptance of the updated terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p>If you have any questions about these Terms of Service, please contact us at:</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p><strong>Pawzr</strong></p>
                <p>Email: support@pawzr.com</p>
                <p>Website: <a href="https://pawzrpro.vercel.app" className="text-orange-500 hover:underline">https://pawzrpro.vercel.app</a></p>
              </div>
            </section>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <Link href="/" className="text-orange-500 hover:underline">Back to Home</Link>
            <p className="text-gray-500 text-sm mt-4">© 2026 Pawzr. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
