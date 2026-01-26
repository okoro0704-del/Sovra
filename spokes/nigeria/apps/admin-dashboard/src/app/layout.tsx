import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SOVRN Protocol Admin Dashboard',
  description: 'Decentralized Identity and Consent Oversight Portal',
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
