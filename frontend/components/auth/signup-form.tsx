"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SocialLoginButton } from '@/components/ui/social-login-button'
import { MessageSquare, HelpCircle } from 'lucide-react'

export function SignupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'method' | 'phone'>('method')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Handle social signup - mainly Telegram for now
  const handleSocialSignup = async (provider: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // In production, this would redirect to the OAuth provider
      // Then the provider would redirect back with auth data
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/verify-otp')
    } catch (err) {
      setError('Social signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle phone number signup - traditional way
  const handlePhoneSignup = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })

      if (response.ok) {
        // Phone number registered, now verify with OTP
        router.push('/verify-otp')
      } else {
        const data = await response.json()
        setError(data.error || 'Signup failed')
      }
    } catch (err) {
      setError('Signup failed. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Create Account
        </h2>
        <p className="text-foreground-secondary">
          Get started with OneStep Authentication
        </p>
      </div>

      {step === 'method' && (
        <>
          {/* Social signup section */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground-secondary mb-4 uppercase tracking-wide">
                Quick Setup with Social Account
              </p>
              
              <SocialLoginButton
                provider="telegram"
                onLogin={handleSocialSignup}
                loading={loading}
                size="lg"
                showName={true}
                className="w-full"
              />
              
              <p className="text-xs text-foreground-tertiary mt-2">
                Secure messaging platform authentication
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-primary" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background-primary text-foreground-tertiary">
                or
              </span>
            </div>
          </div>

          {/* Phone signup option */}
          <div className="text-center">
            <p className="text-sm text-foreground-secondary mb-4">
              Sign up with phone number
            </p>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => setStep('phone')}
            >
              Continue with Phone
            </Button>
          </div>
        </>
      )}

      {step === 'phone' && (
        <div className="space-y-4">
          <button
            onClick={() => setStep('method')}
            className="text-sm text-foreground-tertiary hover:text-foreground-primary mb-4"
          >
            ← Back to signup methods
          </button>
          
          <Input
            label="PHONE NUMBER"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            // error={error}
          />
          
          <Button
            onClick={handlePhoneSignup}
            loading={loading}
            className="w-full"
          >
            Send Verification Code
          </Button>
        </div>
      )}

      {/* Help section */}
      <div className="space-y-4">
        <p className="text-sm text-foreground-tertiary text-center">
          Having trouble creating your account?
        </p>
        
        <Button variant="secondary" className="w-full">
          <HelpCircle className="w-4 h-4 mr-2" />
          Get Help
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
          <p className="text-status-error text-sm text-center">{error}</p>
        </div>
      )}

      {/* Login link */}
      <div className="text-center pt-6 border-t border-border-primary">
        <p className="text-sm text-foreground-tertiary">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-accent-primary hover:text-accent-hover font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>

      {/* Terms notice */}
      <div className="text-center">
        <p className="text-xs text-foreground-tertiary leading-relaxed">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="text-accent-primary hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-accent-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}