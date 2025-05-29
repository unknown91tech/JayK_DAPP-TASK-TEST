'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SocialLoginButton } from '@/components/ui/social-login-button'
import { PasscodeInput } from '@/components/ui/passcode-input'
import { BiometricSelector } from '@/components/ui/biometric-selector'
import { MessageSquare, HelpCircle } from 'lucide-react'

type LoginMethod = 'social' | 'passcode' | 'biometric'

interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export function LoginForm({ onSuccess, redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('social')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  

  // Handle different login methods - basically a traffic controller for auth
  const handleMethodChange = (method: LoginMethod) => {
    setLoginMethod(method)
    setError(null) // Clear any previous errors when switching methods
  }

  // Social login handler - mainly for Telegram in our case
  const handleSocialLogin = async (provider: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Here we'd integrate with the actual OAuth provider
      // For now we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In real implementation, this would redirect to OAuth provider
      // then come back to our callback URL with auth data
      router.push('/verify-otp')
    } catch (err) {
      setError('Social login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Passcode login - for users who prefer the 6-digit PIN
  const handlePasscodeLogin = async (passcode: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/passcode/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      })

      if (response.ok) {
        onSuccess?.()
        router.push(redirectTo)
      } else {
        const data = await response.json()
        setError(data.error || 'Invalid passcode')
      }
    } catch (err) {
      setError('Login failed. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // Biometric login - the fancy Touch ID/Face ID stuff
  const handleBiometricLogin = async (method: string) => {
    setLoading(true)
    setError(null)

    try {
      // This would use WebAuthn API for actual biometric authentication
      await new Promise(resolve => setTimeout(resolve, 1500))
      onSuccess?.()
      router.push(redirectTo)
    } catch (err) {
      setError('Biometric authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section - tells users what they can do */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Welcome Back
        </h2>
        <p className="text-foreground-secondary">
          Sign in with your preferred method
        </p>
      </div>

      {/* Method selector tabs - lets users choose how to login */}
      <div className="flex space-x-1 bg-background-tertiary rounded-lg p-1">
        {[
          { id: 'social', label: 'Social', icon: MessageSquare },
          { id: 'passcode', label: 'Passcode', icon: null },
          { id: 'biometric', label: 'Biometric', icon: null }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleMethodChange(id as LoginMethod)}
            className={`
              flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors
              ${loginMethod === id 
                ? 'bg-accent-primary text-background-primary' 
                : 'text-foreground-secondary hover:text-foreground-primary'
              }
            `}
          >
            <div className="flex items-center justify-center space-x-1">
              {Icon && <Icon className="w-4 h-4" />}
              <span>{label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Dynamic content based on selected method */}
      <div className="min-h-[300px]">
        {loginMethod === 'social' && (
          <div className="text-center space-y-6">
            <div>
              <p className="text-sm text-foreground-tertiary mb-4">
                Choose your messaging platform
              </p>
              <SocialLoginButton
                provider="telegram"
                onLogin={handleSocialLogin}
                loading={loading}
                size="lg"
                showName={true}
                className="w-full"
              />
            </div>
            
            <div className="pt-4 space-y-3">
              <p className="text-sm text-foreground-tertiary">
                Having trouble with social login?
              </p>
              <Button variant="secondary" className="w-full">
                <HelpCircle className="w-4 h-4 mr-2" />
                Get Help
              </Button>
            </div>
          </div>
        )}

        {loginMethod === 'passcode' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground-primary mb-2">
                Enter Your Passcode
              </h3>
              <p className="text-sm text-foreground-secondary">
                Use your 6-digit OneStep passcode
              </p>
            </div>
            
            <PasscodeInput
              onComplete={handlePasscodeLogin}
              error={!!error}
              loading={loading}
            />
            
            <div className="text-center">
              <button 
                className="text-accent-primary text-sm hover:text-accent-hover"
                onClick={() => router.push('/reset-passcode')}
              >
                Forgot your passcode?
              </button>
            </div>
          </div>
        )}

        {loginMethod === 'biometric' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground-primary mb-2">
                Biometric Authentication
              </h3>
              <p className="text-sm text-foreground-secondary">
                Use Touch ID, Face ID, or your device's biometric scanner
              </p>
            </div>
            
            <BiometricSelector
              onSelect={handleBiometricLogin}
              loading={loading}
              error={error}
            />
          </div>
        )}
      </div>

      {/* Error display - shows up when something goes wrong */}
      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
          <p className="text-status-error text-sm text-center">{error}</p>
        </div>
      )}

      {/* Alternative options - quick access to other auth methods */}
      <div className="flex justify-center space-x-6 text-sm">
        {loginMethod !== 'social' && (
          <button
            onClick={() => handleMethodChange('social')}
            className="text-foreground-tertiary hover:text-accent-primary transition-colors"
          >
            Use Social Login
          </button>
        )}
        {loginMethod !== 'biometric' && (
          <button
            onClick={() => handleMethodChange('biometric')}
            className="text-foreground-tertiary hover:text-accent-primary transition-colors"
          >
            Use Biometrics
          </button>
        )}
      </div>

      {/* Sign up link - for new users */}
      <div className="text-center pt-6 border-t border-border-primary">
        <p className="text-sm text-foreground-tertiary">
          Don't have an account?{' '}
          <button
            onClick={() => router.push('/signup')}
            className="text-accent-primary hover:text-accent-hover font-medium"
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  )
}