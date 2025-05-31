// app/(auth)/layout.tsx
import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      {/* Main container with responsive sizing */}
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Auth card container - responsive width: 
            - Small screens: full width minus padding (max-w-md)
            - Large screens: 75% of viewport width (w-3/4)
            - Extra large screens: max 75% but cap at reasonable size (max-w-4xl)
        */}
        <div className="w-full max-w-md lg:w-3/4 lg:max-w-6xl relative">
          {/* Header with logo and navigation buttons */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              {/* Back button - appears on some screens */}
              <Link 
                href="/login" 
                className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
              </Link>
            </div>
            
            {/* OneStep logo/title - centered like in the UI */}
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-foreground-primary tracking-wider">
                ONESTEP
              </h1>
            </div>
            
            {/* Close button */}
            <Link 
              href="/" 
              className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground-secondary" />
            </Link>
          </div>

          {/* Main content area - now with responsive padding and sizing */}
          <div className="bg-background-secondary/50 backdrop-blur-lg border border-border-primary rounded-3xl p-6 md:p-8 lg:p-12 shadow-2xl">
            {children}
          </div>

          {/* Footer with terms and privacy policy */}
          <div className="mt-6 text-center text-sm text-foreground-tertiary">
            <p>
              By using OneStep you agree to our{' '}
              <Link 
                href="/terms" 
                className="text-accent-primary hover:text-accent-hover underline underline-offset-2 transition-colors"
              >
                Terms
              </Link>
              {' & '}
              <Link 
                href="/privacy" 
                className="text-accent-primary hover:text-accent-hover underline underline-offset-2 transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}