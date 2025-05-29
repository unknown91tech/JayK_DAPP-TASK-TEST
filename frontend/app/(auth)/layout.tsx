// app/(auth)/layout.tsx
import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      {/* Main container matching the centered design from screenshots */}
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Auth card container */}
        <div className="w-full max-w-md relative">
          {/* Header with logo and close button */}
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

          {/* Main content area */}
          <div className="bg-background-secondary/50 backdrop-blur-lg border border-border-primary rounded-3xl p-8 shadow-2xl">
            {children}
          </div>

          {/* Footer with terms and privacy policy */}
          <div className="mt-6 text-center text-sm text-foreground-tertiary">
            <p>
              By using Login you agree to our{' '}
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