// app/(auth)/login/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PasscodeInput } from '@/components/ui/passcode-input'
import { 
  Fingerprint, 
  Scan, 
  MessageSquare,
  Smartphone,
  HelpCircle
} from 'lucide-react'

// Different login methods matching the UI screenshots
type LoginMethod = 'social' | 'passcode' | 'biometric'

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('social')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const telegramSession = searchParams.get('telegram_session')

  const handleTelegramAuth = async (sessionToken: string) => {
    try {
      const response = await fetch('/api/auth/social/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken })
      })

      const data = await response.json()
      
      if (data.success) {
        if (data.isNewUser) {
          router.push('/setup-account')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError('Telegram authentication failed')
      }
    } catch (error) {
      setError('Authentication failed')
    }
  }

  useEffect(() => {
    if (telegramSession) {
      // Auto-authenticate with Telegram session
      handleTelegramAuth(telegramSession)
    }
  }, [telegramSession])
  // Handle social login (Telegram in this case)
  const handleSocialLogin = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Here we would integrate with Telegram OAuth
      // For now, let's simulate the flow
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to OTP verification
      router.push('/verify-otp')
    } catch (err) {
      setError('Failed to authenticate with Telegram. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle passcode login
  const handlePasscodeComplete = async (passcode: string) => {
    setLoading(true)
    setError(null)

    try {
      // Verify passcode with backend
      const response = await fetch('/api/auth/passcode/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError('Invalid passcode. Please try again.')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle biometric authentication
  const handleBiometricAuth = async (method: 'touch' | 'face') => {
    setLoading(true)
    setError(null)

    try {
      // WebAuthn integration would go here
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push('/dashboard')
    } catch (err) {
      setError('Biometric authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Render the initial social login screen (Image 1)
  const renderSocialLogin = () => (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">Login</h2>
        <p className="text-foreground-secondary">
          Access Wealth with either your OneStep Passcode, OneStep Biometrics or OneStep ID Verification
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-foreground-secondary mb-4 uppercase tracking-wide">
            Use OneStep ID to Login
          </h3>
          <p className="text-sm text-foreground-tertiary mb-6">
            Use the Onestep Verification to Log into your Account
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground-secondary mb-4 uppercase tracking-wide">
            Kindly select a messenger below
          </p>
          
          {/* Telegram login button */}
          <button
            onClick={handleSocialLogin}
            disabled={loading}
            className="w-16 h-16 mx-auto flex items-center justify-center bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border border-border-primary hover:border-accent-primary rounded-xl transition-all duration-300 transform hover:scale-105 group"
          >
            <MessageSquare className="w-8 h-8" />
          </button>
          
          <p className="text-xs text-accent-primary mt-2">Recovery Center</p>
        </div>

        <div className="pt-4">
          <p className="text-sm text-foreground-tertiary mb-2">
            Having trouble using OneStep Verification?
          </p>
          <Button variant="secondary" className="w-full">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help Centre
          </Button>
        </div>
      </div>

      <div className="pt-6 border-t border-border-primary">
        <p className="text-sm text-foreground-tertiary mb-4">Are you new Here?</p>
        <Link href="/signup">
          <Button variant="primary" className="w-full">
            Sign Up
          </Button>
        </Link>
      </div>
    </div>
  )

  // Render passcode login screen (Image 3)
  const renderPasscodeLogin = () => (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">Login</h2>
        <p className="text-foreground-secondary mb-6">
          Access Wealth with either your OneStep Passcode, OneStep Biometrics or OneStep ID Verification
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground-primary mb-2 uppercase tracking-wide">
          OneStep Passcode
        </h3>
        <p className="text-sm text-foreground-secondary mb-8">
          Enter your Passcode to Log into your Account
        </p>

        <PasscodeInput
          onComplete={handlePasscodeComplete}
          error={!!error}
          loading={loading}
        />

        <div className="mt-6">
          <p className="text-sm text-foreground-tertiary mb-2">
            Can't remember your Passcode?
          </p>
          <Link 
            href="/reset-passcode" 
            className="text-accent-primary hover:text-accent-hover text-sm underline underline-offset-2 transition-colors"
          >
            Reset Passcode
          </Link>
        </div>
      </div>

      <div className="pt-6 border-t border-border-primary">
        <p className="text-sm font-medium text-foreground-secondary mb-4 uppercase">OR</p>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Biometric options */}
          <div className="text-center">
            <h4 className="text-sm font-medium text-foreground-primary mb-3">
              Use Onestep Biometrics to Login
            </h4>
            <p className="text-xs text-foreground-tertiary mb-4">
              Login into your Account made easy with the Onestep Biometrics
            </p>
            
            <div className="space-y-2">
              <button
                onClick={() => handleBiometricAuth('touch')}
                className="flex flex-col items-center justify-center p-3 bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border border-border-primary hover:border-accent-primary rounded-lg transition-all duration-300 group w-full"
              >
                <Fingerprint className="w-6 h-6 mb-1" />
                <span className="text-xs">Touch ID</span>
              </button>
              
              <button
                onClick={() => handleBiometricAuth('face')}
                className="flex flex-col items-center justify-center p-3 bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border border-border-primary hover:border-accent-primary rounded-lg transition-all duration-300 group w-full"
              >
                <Scan className="w-6 h-6 mb-1" />
                <span className="text-xs">Face ID</span>
              </button>
            </div>
            
            <Button variant="ghost" size="sm" className="mt-3 text-xs">
              Onestep Biometrics
            </Button>
          </div>

          {/* Social login option */}
          <div className="text-center">
            <h4 className="text-sm font-medium text-foreground-primary mb-3">
              Use OneStep ID to Login
            </h4>
            <p className="text-xs text-foreground-tertiary mb-4">
              Use your Onestep ID to login to your ECU Account
            </p>
            
            <p className="text-xs font-medium text-foreground-secondary mb-3">
              Kindly select a Messenger
            </p>
            
            <div className="flex justify-center space-x-2 mb-3">
              {/* Social platform icons */}
              <button className="w-8 h-8 flex items-center justify-center bg-background-tertiary border border-border-primary rounded hover:border-accent-primary transition-colors">
                <MessageSquare className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center bg-background-tertiary border border-border-primary rounded hover:border-accent-primary transition-colors">
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-xs text-foreground-tertiary">
            Having trouble using Biometric Verification?
          </p>
          <Button variant="secondary" size="sm" className="w-full">
            Help Centre
          </Button>
        </div>
      </div>
    </div>
  )

  // Render biometric login screen (Image 4)
  const renderBiometricLogin = () => (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">Login</h2>
        <p className="text-foreground-secondary mb-6">
          Access Wealth with either your OneStep Passcode, OneStep Biometrics or OneStep ID Verification
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground-primary mb-2 uppercase tracking-wide">
          Use OneStep Biometrics to Login
        </h3>
        <p className="text-sm text-foreground-secondary mb-8">
          Login to your Account made easy with the Onestep Biometrics
        </p>

        <p className="text-sm font-medium text-foreground-secondary mb-6 uppercase tracking-wide">
          Kindly select a method below
        </p>

        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
          <button
            onClick={() => handleBiometricAuth('touch')}
            disabled={loading}
            className="biometric-option"
          >
            <Fingerprint className="w-12 h-12 text-accent-primary group-hover:text-background-primary transition-colors mb-3" />
            <span className="text-sm font-medium">Touch ID</span>
          </button>

          <button
            onClick={() => handleBiometricAuth('face')}
            disabled={loading}
            className="biometric-option"
          >
            <Scan className="w-12 h-12 text-accent-primary group-hover:text-background-primary transition-colors mb-3" />
            <span className="text-sm font-medium">Face ID</span>
          </button>
        </div>

        {loading && (
          <div className="mt-6">
            <div className="inline-flex items-center text-accent-primary">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Authenticating...
            </div>
          </div>
        )}

        <div className="mt-8">
          <p className="text-sm text-foreground-tertiary mb-2">
            Having trouble using OneStep Verification?
          </p>
          <Button variant="secondary" className="w-full">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help Centre
          </Button>
        </div>
      </div>

      <div className="pt-6 border-t border-border-primary">
        <p className="text-sm font-medium text-foreground-secondary mb-4 uppercase">OR</p>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <h4 className="text-sm font-medium text-foreground-primary mb-2">
              Use OneStep ID to Login
            </h4>
            <p className="text-xs text-foreground-tertiary mb-3">
              Use your Onestep ID to login to your ECU Account
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLoginMethod('social')}
            >
              OneStep ID
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground-primary mb-2">
              Use OneStep Passcode to Login
            </h4>
            <p className="text-xs text-foreground-tertiary mb-3">
              Use your Onestep Passcode to enjoy fast and Easy Logins
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLoginMethod('passcode')}
            >
              Passcode
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // Show error message if there's an error
  if (error) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
          <p className="text-status-error text-sm">{error}</p>
        </div>
        <Button 
          onClick={() => {
            setError(null)
            setLoginMethod('social')
          }}
          variant="secondary"
        >
          Try Again
        </Button>
      </div>
    )
  }

  // Render the appropriate login method
  switch (loginMethod) {
    case 'passcode':
      return renderPasscodeLogin()
    case 'biometric':
      return renderBiometricLogin()
    default:
      return renderSocialLogin()
  }
}