"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/ui/otp-input'
import { Clock, RefreshCw } from 'lucide-react'

interface OtpVerificationProps {
  identifier?: string // phone number or email
  purpose?: 'LOGIN' | 'SIGNUP' | 'RESET'
  onSuccess?: () => void
}

export function OtpVerification({ 
  identifier = 'user@example.com', // Default for demo
  purpose = 'LOGIN',
  onSuccess 
}: OtpVerificationProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Countdown timer - keeps track of OTP expiration
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

  // Format time for display (MM:SS)
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
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, identifier, purpose })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('OTP verified successfully!')
        
        // Handle different flows based on purpose and user status
        if (data.isNewUser) {
          // New user - go to account setup
          setTimeout(() => router.push('/setup-account'), 1000)
        } else {
          // Existing user - go to dashboard or callback
          onSuccess?.()
          setTimeout(() => router.push('/dashboard'), 1000)
        }
      } else {
        setError(data.error || 'Invalid OTP code')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP resend
  const handleResendOtp = async () => {
    setResendLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      })

      if (response.ok) {
        // Reset timer and states
        setTimeLeft(600)
        setCanResend(false)
        setSuccessMessage('New OTP sent successfully!')
        
        // Clear success message after a few seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to resend OTP')
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Verify Your Code
        </h2>
        <p className="text-foreground-secondary">
          We sent a verification code to
        </p>
        <p className="font-medium text-foreground-primary">
          {identifier}
        </p>
      </div>

      {/* Timer display */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-background-tertiary rounded-lg">
          <Clock className="w-4 h-4 text-accent-primary" />
          <span className="text-lg font-mono font-bold text-accent-primary">
            {formatTime(timeLeft)}
          </span>
        </div>
        <p className="text-xs text-foreground-tertiary mt-1">
          {timeLeft > 0 ? 'Time remaining' : 'Code expired'}
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center">
        <OtpInput
          onComplete={handleOtpComplete}
          error={!!error}
          loading={loading}
          autoFocus={true}
        />
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
          <p className="text-status-success text-sm text-center">{successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
          <p className="text-status-error text-sm text-center">{error}</p>
        </div>
      )}

      {/* Resend section */}
      <div className="text-center space-y-3">
        <p className="text-sm text-foreground-tertiary">
          Didn't receive the code?
        </p>
        
        <Button
          variant="secondary"
          onClick={handleResendOtp}
          disabled={!canResend || resendLoading}
          loading={resendLoading}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {canResend ? 'Resend Code' : `Wait ${formatTime(timeLeft)}`}
        </Button>
      </div>

      {/* Help section */}
      <div className="text-center pt-4 border-t border-border-primary">
        <p className="text-xs text-foreground-tertiary mb-2">
          Need help with verification?
        </p>
        <Button variant="ghost" size="sm">
          Contact Support
        </Button>
      </div>

      {/* Code expiry warning */}
      {timeLeft < 60 && timeLeft > 0 && (
        <div className="p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg">
          <p className="text-status-warning text-sm text-center">
            ⚠️ Your code will expire in {timeLeft} seconds
          </p>
        </div>
      )}
    </div>
  )
}