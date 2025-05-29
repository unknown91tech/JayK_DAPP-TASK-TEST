'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageSquare, HelpCircle, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleTelegramSignup = async () => {
    console.log('🚀 Starting Telegram signup with real ID: 1694779369')
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Step 1: Telegram OAuth (simulated)
      console.log('⏳ Step 1: Telegram OAuth...')
      setSuccess('Connecting to Telegram...')
      
      const oauthResponse = await fetch('/api/auth/telegram/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authData: 'real_telegram_user',
          timestamp: Date.now()
        })
      })

      if (!oauthResponse.ok) {
        const errorData = await oauthResponse.json()
        throw new Error(errorData.error || 'Telegram OAuth failed')
      }

      const oauthData = await oauthResponse.json()
      console.log('✅ Step 1 complete:', oauthData)

      // Step 2: Send OTP via Telegram to your real ID
      console.log('⏳ Step 2: Sending OTP to your Telegram (ID: 1694779369)...')
      setSuccess('Sending OTP to your Telegram...')
      
      const otpResponse = await fetch('/api/auth/telegram/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramUserId: 1694779369, // ← Your actual Telegram ID
          firstName: 'User',
          identifier: `telegram_1694779369`
        })
      })

      if (!otpResponse.ok) {
        const errorData = await otpResponse.json()
        throw new Error(errorData.error || 'Failed to send OTP')
      }

      const otpData = await otpResponse.json()
      console.log('✅ Step 2 complete:', otpData)

      // Step 3: Store user data for OTP verification
      const tempUserData = {
        telegramUserId: 1694779369,
        firstName: 'User',
        lastName: '',
        username: 'onestep_user',
        identifier: `telegram_1694779369`,
        telegramSent: otpData.telegramSent,
        // Store development OTP if available
        ...(otpData.devOTP && { devOTP: otpData.devOTP })
      }

      localStorage.setItem('telegram_user_temp', JSON.stringify(tempUserData))
      console.log('💾 User data stored:', tempUserData)

      // Show success message
      if (otpData.telegramSent) {
        setSuccess('✅ OTP sent to your Telegram! Check your messages.')
      } else {
        setSuccess('✅ OTP generated! Check console for development code.')
      }

      // Step 4: Redirect to OTP verification after a short delay
      setTimeout(() => {
        console.log('✅ Redirecting to OTP verification...')
        router.push('/verify-otp')
      }, 2000)

    } catch (err) {
      console.error('❌ Signup error:', err)
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
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
            <p className="text-sm text-accent-primary mt-2">
              Setting up Telegram verification...
            </p>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-status-success" />
              <p className="text-status-success text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
            <p className="text-status-error text-sm">{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="mt-2"
            >
              Try Again
            </Button>
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

      {/* Development Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-left">
          <h4 className="text-sm font-bold text-green-400 mb-2">📱 Your Telegram Setup</h4>
          <div className="text-xs text-green-300 space-y-1">
            <p>✅ Telegram ID: <code>1694779369</code></p>
            <p>✅ Bot: @OneStepTest6_BOT</p>
            <p>✅ Token: {process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Missing'}</p>
            <p className="text-yellow-400">🤖 Make sure you've started a chat with the bot!</p>
            <p className="text-blue-400">💡 Send /start to @OneStepTest6_BOT first</p>
          </div>
        </div>
      )}
    </div>
  )
}