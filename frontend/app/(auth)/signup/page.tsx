// app/(auth)/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageSquare, HelpCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle social signup (Telegram)
  const handleSocialSignup = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Here we would integrate with Telegram OAuth for signup
      // This would involve redirecting to Telegram's OAuth flow
      
      // Simulate the OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // After successful OAuth, redirect to OTP verification
      // In the real implementation, Telegram would redirect back to our app
      // with user data that we'd use to create the account
      router.push('/verify-otp')
    } catch (err) {
      setError('Failed to start signup process. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle help center
  const handleHelpCenter = () => {
    // This could open a modal, navigate to help page, or open external link
    window.open('/help', '_blank')
  }

  return (
    <div className="text-center space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Sign up
        </h2>
        <p className="text-foreground-secondary">
          Complete OneStep Verification
        </p>
      </div>

      {/* Subtitle */}
      <div>
        <p className="text-sm text-foreground-tertiary">
          Complete the OneStep verification to proceed. If you don't have one already, it is important for account verification
        </p>
      </div>

      {/* Main signup section */}
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-foreground-secondary mb-6 uppercase tracking-wide">
            Kindly select a messenger
          </p>
          
          {/* Telegram signup button - matching the design from Image 5 */}
          <button
            onClick={handleSocialSignup}
            disabled={loading}
            className="w-20 h-20 mx-auto flex items-center justify-center bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border border-border-primary hover:border-accent-primary rounded-xl transition-all duration-300 transform hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <MessageSquare className="w-10 h-10" />
            )}
          </button>
        </div>

        {/* Help section */}
        <div className="space-y-4">
          <p className="text-sm text-foreground-tertiary">
            Having trouble using OneStep Verification?
          </p>
          
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleHelpCenter}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Help Centre
          </Button>
        </div>

        {/* Additional info */}
        <div className="pt-4">
          <p className="text-xs text-foreground-tertiary leading-relaxed">
            If you have not yet registered for the OneStep ID, go to the recovery center to use the Seed phrase recovery with your seed phrase to gain access into your account
          </p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl animate-slide-up">
          <p className="text-status-error text-sm">{error}</p>
        </div>
      )}

      {/* Back to login */}
      <div className="pt-6 border-t border-border-primary">
        <p className="text-sm text-foreground-tertiary mb-4">
          Already have an account?
        </p>
        <Button 
          variant="ghost" 
          onClick={() => router.push('/login')}
          className="text-accent-primary hover:text-accent-hover"
        >
          Back to Login
        </Button>
      </div>
    </div>
  )
}