import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pawzr - Connect Pet Owners with Pet Lovers',
  description: 'Pawzr is a mobile app that connects pet owners with pet lovers for pet sitting, walking, and companionship.',
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="px-6 py-4">
        <nav className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🐾</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Pawzr</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-gray-600 hover:text-orange-500">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-600 hover:text-orange-500">Terms of Service</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-orange-500">Pawzr</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            The mobile app that connects pet owners with pet lovers for pet sitting, walking, grooming, veterinary care, and pet supplies.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a href="https://apps.apple.com/app/pawzr/id6757838948" className="bg-black text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition flex items-center gap-2">
              <span>Download on App Store</span>
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.pawzr.app" className="bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-orange-600 transition flex items-center gap-2">
              <span>Get it on Google Play</span>
            </a>
          </div>
        </div>

        {/* What is Pawzr */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What is Pawzr?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🐕</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">For Pet Owners</h3>
              <p className="text-gray-600">Find trusted pet lovers to walk, sit, and care for your furry friends. Connect with verified pet enthusiasts in your area.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">💕</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">For Pet Lovers</h3>
              <p className="text-gray-600">Love pets but dont have one? Meet adorable pets in your neighborhood, earn money, and spread joy to furry friends.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🏥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">For Service Providers</h3>
              <p className="text-gray-600">Vets, groomers, and pet suppliers can list services, manage bookings, and grow their business on Pawzr.</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Pawzr?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-600">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Verified Users</h3>
                <p className="text-gray-600">All users can verify their identity with Aadhaar for trust and safety.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-600">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Easy Matching</h3>
                <p className="text-gray-600">Swipe-based matching to find the perfect pet lover or pet to care for.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-600">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">In-App Chat</h3>
                <p className="text-gray-600">Communicate securely with matches before meeting in person.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-600">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Pawzr Wallet</h3>
                <p className="text-gray-600">Earn rewards, cashback, and loyalty points for every booking.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-orange-500 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Pawzr?</h2>
          <p className="text-xl mb-8 opacity-90">Download the app and start connecting with pet lovers today!</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a href="https://apps.apple.com/app/pawzr/id6757838948" className="bg-white text-orange-500 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition">
              App Store
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.pawzr.app" className="bg-white text-orange-500 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition">
              Google Play
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white">🐾</span>
                </div>
                <span className="text-xl font-bold">Pawzr</span>
              </div>
              <p className="text-gray-400">Connecting pet owners with pet lovers.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Download</h4>
              <ul className="space-y-2">
                <li><a href="https://apps.apple.com/app/pawzr/id6757838948" className="text-gray-400 hover:text-white">App Store</a></li>
                <li><a href="https://play.google.com/store/apps/details?id=com.pawzr.app" className="text-gray-400 hover:text-white">Google Play</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">support@pawzr.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© 2026 Pawzr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
