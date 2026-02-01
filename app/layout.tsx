import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pawzr - Connect Pet Owners with Pet Lovers',
  description: 'Pawzr is a mobile app that connects pet owners with pet lovers for pet sitting, walking, and companionship.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
