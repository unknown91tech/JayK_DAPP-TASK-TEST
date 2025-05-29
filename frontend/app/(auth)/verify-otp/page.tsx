'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/ui/otp-input'

export default function VerifyOtpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [userInfo, setUserInfo] = useState<any>(null)

  // Get user info from localStorage
  useEffect(() => {
    const tempUserData = localStorage.getItem('telegram_user_temp')
    if (tempUserData) {
      setUserInfo(JSON.parse(tempUserData))
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLeft])

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Handle OTP verification
  const handleOtpComplete = async (otp: string) => {
    console.log('🔐 Verifying OTP:', otp)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          otp,
          identifier: userInfo?.identifier || 'telegram_user'
        })
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ OTP verified successfully!')
        
        // Clear temporary data
        localStorage.removeItem('telegram_user_temp')
        
        // Check if new user or existing user
        if (data.isNewUser) {
          router.push('/setup-account')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(data.error || 'Invalid OTP. Please try again.')
      }
    } catch (err) {
      console.error('❌ OTP verification error:', err)
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
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
        {userInfo && (
          <p className="text-sm text-accent-primary">
            Check your Telegram chat with @OneStepTest6_BOT
          </p>
        )}
      </div>

      {/* Timer */}
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

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
          <p className="text-status-error text-sm">{error}</p>
        </div>
      )}

      {/* Proceed Button */}
      <Button 
        variant="primary" 
        className="w-full"
        disabled={loading}
        loading={loading}
      >
        Proceed
      </Button>

      {/* Resend Section */}
      <div className="pt-6 border-t border-border-primary">
        <p className="text-sm text-foreground-tertiary mb-3">
          Didn't receive your OTP?
        </p>
        <Button variant="ghost" size="sm">
          Resend OTP
        </Button>
      </div>

      {/* Help */}
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