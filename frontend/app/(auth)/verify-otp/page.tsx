// app/(auth)/verify-otp/page.tsx
"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/ui/otp-input'
import { CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react'

export default function VerifyOtpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  
  // Context data from previous step (login or signup)
  const [contextData, setContextData] = useState<any>(null)
  const [isLoginFlow, setIsLoginFlow] = useState(false)

  // Load context data from localStorage when component mounts
  useEffect(() => {
    // First check if this is a login flow
    const loginContext = localStorage.getItem('telegram_login_temp')
    if (loginContext) {
      console.log('🔍 Found login context:', loginContext)
      const data = JSON.parse(loginContext)
      setContextData(data)
      setIsLoginFlow(true)
      console.log('✅ Login flow detected, identifier:', data.identifier)
      return
    }

    // Otherwise check for signup context
    const signupContext = localStorage.getItem('telegram_signup_temp')
    if (signupContext) {
      console.log('🔍 Found signup context:', signupContext)
      const data = JSON.parse(signupContext)
      setContextData(data)
      setIsLoginFlow(false)
      console.log('✅ Signup flow detected, identifier:', data.identifier)
      return
    }

    // No context found - redirect to login
    console.log('❌ No OTP context found, redirecting to login')
    router.push('/login')
  }, [router])

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

  // Handle OTP completion - FIXED VERSION with proper redirect
  const handleOtpComplete = async (otp: string) => {
    if (!contextData) {
      setError('Session expired. Please start over.')
      return
    }

    console.log(`🔐 Verifying OTP: ${otp} for ${isLoginFlow ? 'LOGIN' : 'SIGNUP'} flow`)
    console.log('📋 Using identifier:', contextData.identifier)

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Verify OTP with backend
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          otp,
          identifier: contextData.identifier,
          purpose: isLoginFlow ? 'LOGIN' : 'SIGNUP'
        }),
        credentials: 'include' // Important: Include cookies in the request
      })

      console.log('📡 OTP verification response status:', response.status)
      const data = await response.json()
      console.log('📦 OTP verification response data:', data)

      if (response.ok && data.success) {
        console.log('✅ OTP verified successfully!')
        setSuccess('✅ OTP verified successfully!')
        
        // Clear the temporary storage since we're done with it
        if (isLoginFlow) {
          localStorage.removeItem('telegram_login_temp')
          console.log('🗑️ Cleared login context')
        } else {
          localStorage.removeItem('telegram_signup_temp')
          console.log('🗑️ Cleared signup context')
        }

        // FIXED: Better redirect handling
        if (isLoginFlow) {
          // For login: redirect to dashboard
          console.log('✅ Login successful! Redirecting to dashboard...')
          setSuccess('✅ Login successful! Redirecting to dashboard...')
          
          // Wait a moment for the success message to show, then redirect
          setTimeout(() => {
            console.log('🔄 Redirecting to dashboard...')
            router.push('/dashboard')
            // Fallback: If Next.js router fails, use window.location
            setTimeout(() => {
              if (window.location.pathname !== '/dashboard') {
                console.log('🔄 Router redirect failed, using window.location...')
                window.location.href = '/dashboard'
              }
            }, 1000)
          }, 1500)
          
        } else {
          // For signup: check if user needs setup or go to dashboard
          if (data.isNewUser || data.requiresSetup) {
            console.log('✅ New user! Redirecting to account setup...')
            setSuccess('✅ Account created! Setting up your profile...')
            setTimeout(() => {
              console.log('🔄 Redirecting to setup...')
              router.push('/setup-account')
              // Fallback for setup redirect
              setTimeout(() => {
                if (window.location.pathname !== '/setup-account') {
                  console.log('🔄 Router redirect failed, using window.location...')
                  window.location.href = '/setup-account'
                }
              }, 1000)
            }, 1500)
          } else {
            // User somehow already exists but came through signup
            console.log('✅ Account verified! Redirecting to dashboard...')
            setSuccess('✅ Account verified! Redirecting to dashboard...')
            setTimeout(() => {
              console.log('🔄 Redirecting to dashboard...')
              router.push('/dashboard')
              // Fallback for dashboard redirect
              setTimeout(() => {
                if (window.location.pathname !== '/dashboard') {
                  console.log('🔄 Router redirect failed, using window.location...')
                  window.location.href = '/dashboard'
                }
              }, 1000)
            }, 1500)
          }
        }

      } else {
        // Handle various error cases
        console.log('❌ OTP verification failed:', data.error)
        if (data.error?.includes('expired')) {
          setError('OTP has expired. Please request a new one.')
          setCanResend(true)
        } else if (data.error?.includes('invalid') || data.error?.includes('Invalid')) {
          setError('Invalid OTP code. Please check and try again.')
        } else if (data.error?.includes('maximum') || data.error?.includes('attempts')) {
          setError('Too many attempts. Please request a new OTP.')
          setCanResend(true)
        } else {
          setError(data.error || 'OTP verification failed. Please try again.')
        }
      }
    } catch (err) {
      console.error('❌ OTP verification error:', err)
      setError('Verification failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (!contextData) {
      setError('Session expired. Please start over.')
      return
    }

    console.log('🔄 Resending OTP for:', contextData.identifier)
    setResendLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Use the appropriate resend endpoint based on flow type
      const response = await fetch('/api/auth/telegram/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramUserId: contextData.telegramUserId,
          firstName: contextData.firstName,
          identifier: contextData.identifier,
          purpose: isLoginFlow ? 'LOGIN' : 'SIGNUP'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Reset timer and states
        setTimeLeft(600)
        setCanResend(false)
        
        if (data.telegramSent) {
          setSuccess('✅ New OTP sent to your Telegram!')
        } else {
          setSuccess('✅ New OTP generated! Check console for development code.')
        }
        
        // Show success message briefly
        setTimeout(() => setSuccess(null), 3000)
        
        console.log('✅ OTP resent successfully')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to resend OTP')
      }
    } catch (err) {
      console.error('❌ Resend OTP error:', err)
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  // Manual redirect function for testing
  const handleManualRedirect = () => {
    console.log('🔄 Manual redirect to dashboard...')
    router.push('/dashboard')
    // Immediate fallback if needed
    setTimeout(() => {
      if (window.location.pathname !== '/dashboard') {
        window.location.href = '/dashboard'
      }
    }, 500)
  }

  // Don't render anything until we have context data
  if (!contextData) {
    return (
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-foreground-secondary">Loading verification...</p>
      </div>
    )
  }

  return (
    <div className="text-center space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          OTP Verification
        </h2>
        <p className="text-foreground-secondary">
          {isLoginFlow 
            ? 'Enter the login code sent to your Telegram' 
            : 'Complete the Onestep verification to proceed. It is important for account verification'
          }
        </p>
      </div>

      {/* Flow indicator */}
      <div className="flex items-center justify-center space-x-2 py-2 px-4 bg-accent-primary/10 border border-accent-primary/20 rounded-lg inline-flex">
        <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
        <span className="text-sm font-medium text-accent-primary">
          {isLoginFlow ? 'Login Verification' : 'Account Setup'}
        </span>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <p className="text-sm text-foreground-tertiary">
          Enter the {isLoginFlow ? 'login' : 'verification'} code sent to your Telegram
        </p>
        <p className="text-xs text-foreground-tertiary">
          Check your messages from @OneStepTest6_BOT
        </p>
      </div>

      {/* Timer display */}
      <div className="py-4">
        <div className="flex items-center justify-center space-x-2">
          <Clock className="w-5 h-5 text-accent-primary" />
          <div className="text-2xl font-mono font-bold text-accent-primary">
            {formatTime(timeLeft)}
          </div>
        </div>
        <p className="text-xs text-foreground-tertiary mt-1">
          {timeLeft > 0 ? 'Time remaining' : 'Code expired'}
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

      {/* Success message */}
      {success && (
        <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl animate-slide-up">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-5 h-5 text-status-success" />
            <p className="text-status-success text-sm font-medium">{success}</p>
          </div>
          {/* Show manual redirect button if success but not redirected yet */}
          {success.includes('successful') && (
            <Button 
              onClick={handleManualRedirect}
              variant="secondary"
              size="sm"
              className="mt-3"
            >
              Go to Dashboard →
            </Button>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl animate-slide-up">
          <div className="flex items-center justify-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-status-error" />
            <p className="text-status-error text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Resend OTP section */}
      <div className="pt-6 border-t border-border-primary">
        <p className="text-sm text-foreground-tertiary mb-3">
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
      <div className="text-center pt-4">
        <p className="text-xs text-foreground-tertiary mb-2">
          Need help with verification?
        </p>
        <Button variant="ghost" size="sm">
          Contact Support
        </Button>
      </div>

      {/* Development Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-left">
          <h4 className="text-sm font-bold text-blue-400 mb-2">🔐 OTP Debug Info</h4>
          <div className="text-xs text-blue-300 space-y-1 font-mono">
            <p>🔄 Flow: <span className="text-yellow-400">{isLoginFlow ? 'LOGIN' : 'SIGNUP'}</span></p>
            <p>🆔 Identifier: <code className="bg-blue-800/50 px-1 rounded">{contextData?.identifier}</code></p>
            <p>📱 Telegram ID: <code className="bg-blue-800/50 px-1 rounded">{contextData?.telegramUserId}</code></p>
            <p>👤 Name: <code className="bg-blue-800/50 px-1 rounded">{contextData?.firstName}</code></p>
            <p>🤖 Purpose: <code className="bg-blue-800/50 px-1 rounded">{isLoginFlow ? 'LOGIN' : 'SIGNUP'}</code></p>
            {contextData?.devOTP && (
              <p className="text-green-400">🔑 Dev OTP: <code className="bg-green-800/50 px-1 rounded">{contextData.devOTP}</code></p>
            )}
            <p className="text-yellow-400 mt-2">💡 Check your Telegram for the actual OTP!</p>
            <div className="mt-3 pt-2 border-t border-blue-500/30">
              <Button 
                onClick={handleManualRedirect}
                size="sm"
                variant="secondary"
                className="text-xs"
              >
                🧪 Test Dashboard Redirect
              </Button>
            </div>
          </div>
        </div>
      )}

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