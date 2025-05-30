// app/(auth)/signup/page.tsx - Fixed signup with proper data handling
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageSquare, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Main signup handler with proper error handling and data flow
  const handleTelegramSignup = async () => {
    console.log('🚀 Starting Telegram signup with real ID: 1694779369')
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Step 1: Telegram OAuth validation (simulated for development)
      console.log('⏳ Step 1: Validating Telegram OAuth...')
      setSuccess('Connecting to Telegram...')
      
      const oauthResponse = await fetch('/api/auth/telegram/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authData: 'new_telegram_user', // Indicates this is a new user signup
          timestamp: Date.now(),
          loginFlow: false // This is signup, not login
        })
      })

      if (!oauthResponse.ok) {
        const errorData = await oauthResponse.json()
        throw new Error(errorData.error || 'Telegram OAuth failed')
      }

      const oauthData = await oauthResponse.json()
      console.log('✅ Step 1 complete - OAuth validated:', oauthData)

      // Step 2: Send OTP via Telegram to your real ID  
      console.log('⏳ Step 2: Sending OTP to your Telegram (ID: 1694779369)...')
      setSuccess('Sending verification code to your Telegram...')
      
      const otpResponse = await fetch('/api/auth/telegram/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramUserId: 1694779369, // Your actual Telegram ID
          firstName: 'User', // This will be updated during account setup
          identifier: `telegram_1694779369`, // Unique identifier for this user
          purpose: 'SIGNUP' // Explicitly mark as signup flow
        })
      })

      if (!otpResponse.ok) {
        const errorData = await otpResponse.json()
        console.error('❌ OTP send failed:', errorData)
        
        // Handle specific error cases
        if (errorData.error?.includes('already exists')) {
          throw new Error('An account with this Telegram is already registered. Please login instead.')
        }
        
        throw new Error(errorData.error || 'Failed to send verification code')
      }

      const otpData = await otpResponse.json()
      console.log('✅ Step 2 complete - OTP sent:', otpData)

      // Step 3: Store signup context for OTP verification page
      const signupContext = {
        telegramUserId: 1694779369,
        firstName: 'User', // Temporary name, will be updated in setup
        lastName: '',
        username: '', // Will be set during account setup
        identifier: `telegram_1694779369`,
        purpose: 'SIGNUP',
        telegramSent: otpData.telegramSent,
        isSignup: true, // Flag to indicate this is signup flow
        // Include development OTP if available (for testing)
        ...(otpData.devOTP && { devOTP: otpData.devOTP })
      }

      // Store in localStorage for the OTP verification page
      localStorage.setItem('telegram_signup_temp', JSON.stringify(signupContext))
      console.log('💾 Signup context stored:', signupContext)

      // Step 4: Show success message based on whether Telegram was actually sent
      if (otpData.telegramSent) {
        setSuccess('✅ Verification code sent to your Telegram! Check your messages from @OneStepTest6_BOT.')
      } else {
        setSuccess('✅ Verification code generated! Check console for development code.')
        // In development, also show the OTP in the UI for easier testing
        if (process.env.NODE_ENV === 'development' && otpData.devOTP) {
          setSuccess(`✅ Dev OTP: ${otpData.devOTP} (Check console for details)`)
        }
      }

      // Step 5: Redirect to OTP verification after showing success message
      setTimeout(() => {
        console.log('✅ Redirecting to OTP verification...')
        router.push('/verify-otp')
      }, 3000) // Give user time to read the success message

    } catch (err) {
      console.error('❌ Signup error:', err)
      
      // Set user-friendly error message
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Signup failed. Please try again.')
      }
      
      setSuccess(null)
    } finally {
      setLoading(false)
    }
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

      {/* Instructions */}
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
          
          {/* Telegram signup button */}
          <button
            onClick={handleTelegramSignup}
            disabled={loading}
            className={`
              w-20 h-20 mx-auto flex items-center justify-center 
              bg-background-tertiary hover:bg-accent-primary hover:text-background-primary 
              border border-border-primary hover:border-accent-primary 
              rounded-xl transition-all duration-300 transform hover:scale-105 
              disabled:opacity-50 disabled:cursor-not-allowed
              ${loading ? 'animate-pulse' : ''}
            `}
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
          
          {loading && (
            <p className="text-sm text-accent-primary mt-2 animate-pulse">
              Setting up Telegram verification...
            </p>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl animate-fade-in">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-status-success" />
              <p className="text-status-success text-sm font-medium">{success}</p>
            </div>
            {/* Show additional instructions if code was sent */}
            {success.includes('sent to your Telegram') && (
              <div className="mt-3 text-xs text-status-success/80">
                <p>• Check your Telegram messages</p>
                <p>• Look for a message from @OneStepTest6_BOT</p>
                <p>• Youll be redirected automatically</p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl animate-fade-in">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-status-error mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-status-error text-sm font-medium">{error}</p>
                
                {/* Show helpful suggestions based on error type */}
                {error.includes('already registered') && (
                  <div className="mt-2 text-xs text-status-error/80">
                    <p>• Try logging in instead</p>
                    <p>• Use account recovery if needed</p>
                  </div>
                )}
                
                {error.includes('failed to send') && (
                  <div className="mt-2 text-xs text-status-error/80">
                    <p>• Make sure you've started a chat with @OneStepTest6_BOT</p>
                    <p>• Check your internet connection</p>
                    <p>• Try again in a few moments</p>
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setError(null)}
                  className="mt-3 text-status-error hover:text-status-error/80"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="space-y-4">
          <p className="text-sm text-foreground-tertiary">
            Having trouble using OneStep Verification?
          </p>
          
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => router.push('/help')}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Help Centre
          </Button>
        </div>
      </div>

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

      {/* Development Debug Panel - Only shown in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-left">
          <h4 className="text-sm font-bold text-green-400 mb-2">📱 Development Setup Info</h4>
          <div className="text-xs text-green-300 space-y-1">
            <p>✅ Telegram ID: <code className="bg-green-800/50 px-1 rounded">1694779369</code></p>
            <p>✅ Bot: <code className="bg-green-800/50 px-1 rounded">@OneStepTest6_BOT</code></p>
            <p>✅ Token: <code className="bg-green-800/50 px-1 rounded">{process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Missing'}</code></p>
            <p className="text-yellow-400">🤖 Make sure you've started a chat with the bot!</p>
            <p className="text-blue-400">💡 Send /start to @OneStepTest6_BOT first</p>
            <div className="mt-2 pt-2 border-t border-green-500/30">
              <p className="text-orange-400">🔧 If signup fails:</p>
              <p className="text-xs">• Check browser console for detailed logs</p>
              <p className="text-xs">• Verify database connection</p>
              <p className="text-xs">• Check Prisma schema is up to date</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}