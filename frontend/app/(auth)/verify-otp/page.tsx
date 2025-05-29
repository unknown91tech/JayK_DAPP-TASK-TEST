// app/(auth)/verify-otp/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/ui/otp-input'

export default function VerifyOtpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [timeLeft])

  // Format time display (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Handle OTP completion
  const handleOtpComplete = async (otp: string) => {
    setLoading(true)
    setError(null)

    try {
      // Verify OTP with backend
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          otp,
          // In a real app, we'd get this from context or URL params
          identifier: 'user@example.com' // or phone number
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Check if this is signup or login flow
        if (data.isNewUser) {
          router.push('/setup-account')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(data.message || 'Invalid OTP. Please try again.')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle resend OTP
  const handleResendOtp = async () => {
    setResendLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: 'user@example.com' // This should come from context
        })
      })

      if (response.ok) {
        // Reset timer and states
        setTimeLeft(600)
        setCanResend(false)
        // Show success message briefly
        setError(null)
      } else {
        setError('Failed to resend OTP. Please try again.')
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="text-center space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          OTP Verification
        </h2>
        <p className="text-foreground-secondary">
          Complete the Onestep verification to proceed. It is important for account verification
        </p>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <p className="text-sm text-foreground-tertiary">
          Enter the OTP verification code sent to you
        </p>
      </div>

      {/* Timer display */}
      <div className="py-4">
        <div className="text-2xl font-mono font-bold text-accent-primary">
          {formatTime(timeLeft)}
        </div>
        <p className="text-xs text-foreground-tertiary mt-1">
          {timeLeft > 0 ? 'Minutes' : 'Expired'}
        </p>
      </div>

      {/* OTP Input */}
      <div className="py-4">
        <OtpInput
          onComplete={handleOtpComplete}
          error={!!error}
          loading={loading}
          autoFocus={true}
        />
      </div>

      {/* Proceed button */}
      <div className="pt-4">
        <Button 
          variant="primary" 
          className="w-full"
          disabled={loading}
          loading={loading}
        >
          Proceed
        </Button>
      </div>

      {/* Resend OTP section */}
      <div className="pt-6 border-t border-border-primary">
        <p className="text-sm text-foreground-tertiary mb-3">
          Didn't receive your OTP?
        </p>
        
        <button
          onClick={handleResendOtp}
          disabled={!canResend || resendLoading}
          className={`text-sm transition-colors inline-flex items-center ${
            canResend 
              ? 'text-accent-primary hover:text-accent-hover cursor-pointer' 
              : 'text-foreground-tertiary cursor-not-allowed'
          }`}
        >
          {resendLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            <>
              Resend OTP
              {/* Info icon */}
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl animate-slide-up">
          <p className="text-status-error text-sm">{error}</p>
        </div>
      )}

      {/* Help section */}
      <div className="text-center pt-4">
        <p className="text-xs text-foreground-tertiary mb-2">
          Need help with verification?
        </p>
        <Button variant="ghost" size="sm">
          Contact Support
        </Button>
      </div>
    </div>
  )
}