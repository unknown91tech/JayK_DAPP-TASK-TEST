// app/layout.tsx
import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import './globals.css'

// And use CSS instead in globals.css:
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

// Using Inter font because it's clean and modern - perfect for our auth system
// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OneStep Authentication',
  description: 'Secure multi-layered authentication system for the digital age',
  keywords: ['authentication', 'biometric', 'SSO', 'security'],
  authors: [{ name: 'OneStep Team' }],
  // These meta tags help with SEO and social sharing
  openGraph: {
    title: 'OneStep Authentication',
    description: 'Secure access to your digital world',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`bg-background-primary text-foreground-primary antialiased`}>
        {/* Main app wrapper - this ensures consistent dark theme across all pages */}
        <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
          {children}
        </div>
        
        {/* We might want to add global modals, notifications, etc. here later */}
        <div id="modal-root" />
        <div id="notification-root" />
      </body>
    </html>
  )
}