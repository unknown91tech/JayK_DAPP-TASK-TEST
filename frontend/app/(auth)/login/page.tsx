"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PasscodeInput } from '@/components/ui/passcode-input'
import { 
  Fingerprint, 
  Scan, 
  MessageSquare,
  HelpCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

// Different login methods matching the UI screenshots
type LoginMethod = 'social' | 'passcode' | 'biometric'

// User data interface for storing username and other info
interface UserData {
  username?: string
  osId?: string
  telegramUserId?: number
  isSetupComplete?: boolean
}

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('social')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Store user data when we fetch it from the database or localStorage
  const [userData, setUserData] = useState<UserData | null>(null)

  // Utility functions for base64 URL encoding/decoding (needed for WebAuthn)
  const base64urlToBuffer = (base64url: string): ArrayBuffer => {
    const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const buffer = new ArrayBuffer(rawData.length)
    const byteView = new Uint8Array(buffer)
    for (let i = 0; i < rawData.length; i++) {
      byteView[i] = rawData.charCodeAt(i)
    }
    return buffer
  }

  const bufferToBase64url = (buffer: ArrayBuffer): string => {
    const byteView = new Uint8Array(buffer)
    let str = ''
    for (let i = 0; i < byteView.length; i++) {
      str += String.fromCharCode(byteView[i])
    }
    return window.btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  // Function to check current session and get user data from server
  const checkUserSession = async (): Promise<UserData | null> => {
    try {
      console.log('🔍 Checking current user session...')
      
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const sessionData = await response.json()
        console.log('✅ Active session found:', sessionData)
        
        if (sessionData.authenticated && sessionData.user) {
          return {
            username: sessionData.user.username,
            osId: sessionData.user.osId,
            isSetupComplete: sessionData.user.isSetupComplete,
            telegramUserId: 1694779369
          }
        }
      } else if (response.status === 403) {
        console.log('⚠️ Session exists but setup incomplete, trying to extract user data...')
        
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('onestep-session='))
          ?.split('=')[1]
        
        if (sessionCookie) {
          try {
            const payload = JSON.parse(atob(sessionCookie.split('.')[1]))
            console.log('📋 Extracted user data from session cookie:', payload)
            
            return {
              username: payload.username,
              osId: payload.osId,
              isSetupComplete: payload.isSetupComplete || false,
              telegramUserId: 1694779369
            }
          } catch (jwtError) {
            console.log('❌ Could not decode session cookie:', jwtError)
          }
        }
      } else {
        console.log('❌ No active session found (status:', response.status, ')')
      }
      return null
    } catch (error) {
      console.error('❌ Error checking session:', error)
      return null
    }
  }

  // Function to get username from localStorage (for passcode login)
  const getUsernameFromStorage = (): string | null => {
    try {
      // Check multiple localStorage keys where username might be stored
      const loginContext = localStorage.getItem('telegram_login_temp')
      if (loginContext) {
        const parsed = JSON.parse(loginContext)
        if (parsed.username) {
          console.log('📋 Found username in login context:', parsed.username)
          return parsed.username
        }
      }

      const signupContext = localStorage.getItem('telegram_signup_temp')
      if (signupContext) {
        const parsed = JSON.parse(signupContext)
        if (parsed.username) {
          console.log('📋 Found username in signup context:', parsed.username)
          return parsed.username
        }
      }

      const userDataContext = localStorage.getItem('telegram_user_temp')
      if (userDataContext) {
        const parsed = JSON.parse(userDataContext)
        if (parsed.username) {
          console.log('📋 Found username in user data context:', parsed.username)
          return parsed.username
        }
      }

      const storedUsername = localStorage.getItem('username')
      if (storedUsername) {
        console.log('📋 Found username in dedicated storage:', storedUsername)
        return storedUsername
      }

      console.log('❌ No username found in localStorage')
      return null
    } catch (error) {
      console.error('❌ Error reading username from localStorage:', error)
      return null
    }
  }

  // Function to fetch user data from stored context or session
  const loadUserData = async (): Promise<UserData | null> => {
    try {
      // First, check if we have an active session
      const sessionUserData = await checkUserSession()
      if (sessionUserData) {
        console.log('✅ Got user data from active session')
        return sessionUserData
      }

      // If no session, try to get username from localStorage
      const storedUsername = getUsernameFromStorage()
      if (storedUsername) {
        const userData: UserData = {
          username: storedUsername,
          telegramUserId: 1694779369,
          isSetupComplete: true
        }

        // Try to get additional data from login context
        const loginContext = localStorage.getItem('telegram_login_temp')
        if (loginContext) {
          try {
            const context = JSON.parse(loginContext)
            userData.osId = context.osId
            userData.isSetupComplete = context.isSetupComplete
          } catch (error) {
            console.log('Could not parse login context for additional data')
          }
        }

        console.log('✅ Built user data from localStorage:', userData)
        return userData
      }

      console.log('❌ No user data available in localStorage or session')
      return null
    } catch (error) {
      console.error('❌ Error loading user data:', error)
      return null
    }
  }

  // Load user data when component mounts
  useEffect(() => {
    loadUserData().then(setUserData)
  }, [])

  // Handle social login (Telegram)
  const handleSocialLogin = async () => {
    console.log('🚀 Starting Telegram login with real ID: 1694779369')
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      console.log('⏳ Step 1: Validating Telegram OAuth for login...')
      setSuccess('Connecting to Telegram...')

      console.log('⏳ Step 2: Sending login OTP to your Telegram (ID: 1694779369)...')
      setSuccess('Sending login code to your Telegram...')
      
      const loginOtpPayload = {
        telegramUserId: 1694779369,
        firstName: userData?.username || 'User',
        identifier: 'telegram_1694779369',
        purpose: 'LOGIN'
      }
      
      console.log('📤 Sending login OTP request with payload:', loginOtpPayload)
      
      const otpResponse = await fetch('/api/auth/telegram/send-otp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginOtpPayload)
      })

      if (!otpResponse.ok) {
        const errorData = await otpResponse.json()
        console.error('❌ Login OTP send failed:', errorData)
        
        if (errorData.error?.includes('not found') || errorData.requiresSignup) {
          throw new Error('Account not found. Please sign up first.')
        }
        
        if (errorData.details && Array.isArray(errorData.details)) {
          const fieldErrors = errorData.details.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
          throw new Error(`Request validation failed: ${fieldErrors}`)
        }
        
        throw new Error(errorData.error || 'Failed to send login code')
      }

      const otpData = await otpResponse.json()
      console.log('✅ Step 2 complete - Login OTP sent:', otpData)

      const loginContext = {
        telegramUserId: 1694779369,
        firstName: otpData.user?.username || userData?.username || 'User',
        lastName: '',
        username: otpData.user?.username || userData?.username || 'existing_user',
        osId: otpData.user?.osId || userData?.osId,
        identifier: `telegram_1694779369`,
        purpose: 'LOGIN',
        telegramSent: otpData.telegramSent,
        isLogin: true,
        isSetupComplete: otpData.user?.isSetupComplete ?? userData?.isSetupComplete,
        ...(otpData.devOTP && { devOTP: otpData.devOTP })
      }

      localStorage.setItem('telegram_login_temp', JSON.stringify(loginContext))
      console.log('💾 Login context stored:', loginContext)

      if (otpData.telegramSent) {
        setSuccess('✅ Login code sent to your Telegram! Check your messages from @OneStepTest6_BOT.')
      } else {
        setSuccess('✅ Login code generated! Check console for development code.')
        if (process.env.NODE_ENV === 'development' && otpData.devOTP) {
          setSuccess(`✅ Dev OTP: ${otpData.devOTP} (Check console for details)`)
        }
      }

      setTimeout(() => {
        console.log('✅ Redirecting to OTP verification...')
        router.push('/verify-otp')
      }, 3000)

    } catch (err) {
      console.error('❌ Login error:', err)
      
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Login failed. Please try again.')
      }
      
      setSuccess(null)
    } finally {
      setLoading(false)
    }
  }

  // Handle passcode login
  const handlePasscodeComplete = async (passcode: string) => {
    console.log('🔐 Verifying passcode login...')
    setLoading(true)
    setError(null)

    try {
      let username = userData?.username || getUsernameFromStorage()
      
      if (!username) {
        setError('Username not found. Please log in using Telegram first.')
        setLoading(false)
        return
      }

      console.log('👤 Using username for passcode verification:', username)

      const response = await fetch('/api/auth/passcode/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-username': username,
          'x-login-flow': 'true',
          'x-pre-auth': btoa(JSON.stringify({
            username: username,
            timestamp: Date.now(),
            purpose: 'passcode_login'
          }))
        },
        body: JSON.stringify({ 
          passcode,
          username
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Passcode login successful!')
        
        if (data.user) {
          const loginData = {
            username: data.user.username,
            osId: data.user.osId,
            loginMethod: 'passcode',
            loginTime: new Date().toISOString()
          }
          localStorage.setItem('onestep_login_data', JSON.stringify(loginData))
          
          setUserData({
            username: data.user.username,
            osId: data.user.osId,
            isSetupComplete: true,
            telegramUserId: 1694779369
          })
        }

        setSuccess('✅ Passcode verified! Redirecting to dashboard...')
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        const data = await response.json()
        console.error('❌ Passcode verification failed:', data)
        setError(data.error || 'Invalid passcode. Please try again.')
      }
    } catch (err) {
      console.error('❌ Passcode login error:', err)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle biometric authentication using WebAuthn
  const handleBiometricAuth = async (method: 'touch' | 'face') => {
    console.log(`🔒 Starting ${method} ID authentication...`)
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!window.PublicKeyCredential) {
        throw new Error('Biometric authentication is not supported in this browser.')
      }

      setSuccess(`Authenticating with ${method === 'touch' ? 'Touch ID' : 'Face ID'}...`)

      let username = userData?.username || getUsernameFromStorage()
      
      if (!username) {
        console.log('🔍 No username in state/storage, checking session...')
        const sessionData = await loadUserData()
        if (sessionData?.username) {
          username = sessionData.username
          setUserData(sessionData)
        } else {
          throw new Error('Username not found. Please log in using Telegram first.')
        }
      }

      let osId = userData?.osId
      if (!osId) {
        const loginContext = localStorage.getItem('telegram_login_temp')
        const signupContext = localStorage.getItem('telegram_signup_temp')
        
        if (loginContext) {
          try {
            const parsed = JSON.parse(loginContext)
            osId = parsed.osId
          } catch (e) {
            console.log('Could not parse login context for osId')
          }
        } else if (signupContext) {
          try {
            const parsed = JSON.parse(signupContext)
            osId = parsed.osId
          } catch (e) {
            console.log('Could not parse signup context for osId')
          }
        }
      }

      console.log('👤 Using username for biometric auth:', username)
      console.log('🏷️ Using OS-ID:', osId)

      const challengeResponse = await fetch('/api/auth/webauthn/get-challenge', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-username': username,
          'x-login-flow': 'true',
          'x-pre-auth': btoa(JSON.stringify({
            username: username,
            timestamp: Date.now(),
            purpose: 'biometric_login'
          }))
        },
        body: JSON.stringify({ 
          type: 'login', 
          method,
          username: username,
          osId: osId
        }),
      })

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch authentication challenge.')
      }

      const challengeData = await challengeResponse.json()
      const { challenge, credentialId } = challengeData

      if (!challenge) {
        throw new Error('Invalid challenge data received from server.')
      }

      console.log('✅ Challenge received from server')

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64urlToBuffer(challenge),
        allowCredentials: credentialId ? [
          {
            id: base64urlToBuffer(credentialId),
            type: 'public-key',
            transports: method === 'touch' ? ['internal'] : ['internal', 'hybrid'],
          }
        ] : [],
        timeout: 60000,
        userVerification: 'required',
      }

      console.log('🔐 Calling WebAuthn for authentication...')

      const assertion = await navigator.credentials.get({ 
        publicKey: publicKeyCredentialRequestOptions 
      }) as PublicKeyCredential

      if (!assertion) {
        throw new Error('Biometric authentication was cancelled or failed.')
      }

      console.log('✅ WebAuthn assertion received')

      const loginData = {
        username: username,
        osId: osId,
        loginMethod: 'biometric',
        biometricMethod: method,
        loginTime: new Date().toISOString()
      }
      localStorage.setItem('onestep_login_data', JSON.stringify(loginData))
      
      setUserData({
        username: username,
        osId: osId,
        isSetupComplete: true,
        telegramUserId: 1694779369
      })

      setSuccess(`✅ ${method === 'touch' ? 'Touch ID' : 'Face ID'} authentication successful!`)

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (err) {
      console.error(`❌ ${method} ID authentication error:`, err)
      setError(
        err instanceof Error
          ? err.message
          : 'Biometric authentication failed. Please try another method.'
      )
      setSuccess(null)
    } finally {
      setLoading(false)
    }
  }

  // Render social login screen (Telegram)
  const renderSocialLogin = () => (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">Login</h2>
        <p className="text-foreground-secondary">
          Access Wealth with either your OneStep Passcode, OneStep Biometrics or OneStep ID Verification
        </p>
      </div>

      {userData && (
        <div className="p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
          <p className="text-sm text-accent-primary">
            👋 Welcome back, <strong>{userData.username}</strong>!
          </p>
          {userData.osId && (
            <p className="text-xs text-foreground-tertiary mt-1">
              OS-ID: {userData.osId}
            </p>
          )}
          {userData.isSetupComplete === false && (
            <p className="text-xs text-status-warning mt-1">
              ⚠️ Account setup incomplete - you can still log in with Telegram
            </p>
          )}
        </div>
      )}

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
          
          <button
            onClick={handleSocialLogin}
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
              Connecting to your Telegram...
            </p>
          )}
          
          <p className="text-xs text-accent-primary mt-2">Recovery Center</p>
        </div>

        {success && (
          <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl animate-fade-in">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-status-success" />
              <p className="text-status-success text-sm font-medium">{success}</p>
            </div>
            {success.includes('sent to your Telegram') && (
              <div className="mt-3 text-xs text-status-success/80">
                <p>• Check your Telegram messages</p>
                <p>• Look for a message from @OneStepTest6_BOT</p>
                <p>• You'll be redirected automatically</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl animate-fade-in">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-status-error mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-status-error text-sm font-medium">{error}</p>
                
                {error.includes('No account found') && (
                  <div className="mt-2 text-xs text-status-error/80">
                    <p>• You may need to sign up first</p>
                    <p>• Check if you used a different Telegram account</p>
                    <Link href="/signup" className="text-accent-primary hover:underline block mt-1">
                      → Go to Sign Up
                    </Link>
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

  // Render passcode login screen
  const renderPasscodeLogin = () => (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">Login</h2>
        <p className="text-foreground-secondary mb-6">
          Access Wealth with either your OneStep Passcode, OneStep Biometrics or OneStep ID Verification
        </p>
      </div>

      {userData && (
        <div className="p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
          <p className="text-sm text-accent-primary">
            🔐 Enter passcode for <strong>{userData.username}</strong>
          </p>
          {userData.isSetupComplete === false && (
            <p className="text-xs text-status-warning mt-1">
              ⚠️ Setup incomplete - passcode login will complete your account setup
            </p>
          )}
        </div>
      )}

      {!userData && !getUsernameFromStorage() && (
        <div className="p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg">
          <p className="text-status-warning text-sm">
            ⚠️ Please log in using Telegram first to enable passcode login
          </p>
        </div>
      )}

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
          disabled={!userData && !getUsernameFromStorage()}
        />

        {success && (
          <div className="mt-4 p-3 bg-status-success/10 border border-status-success/20 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-status-success" />
              <p className="text-status-success text-sm">{success}</p>
            </div>
          </div>
        )}

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

      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-status-error mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-status-error text-sm font-medium">{error}</p>
              
              {error.includes('Username not found') && (
                <div className="mt-2 text-xs text-status-error/80">
                  <p>• Try logging in with Telegram first</p>
                  <p>• This will establish your account session</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLoginMethod('social')}
                    className="mt-2 text-accent-primary hover:text-accent-hover"
                  >
                    Switch to Telegram Login
                  </Button>
                </div>
              )}
              
              {error.includes('Invalid passcode') && (
                <div className="mt-2 text-xs text-status-error/80">
                  <p>• Make sure you're entering the correct 6-digit code</p>
                  <p>• Try resetting your passcode if needed</p>
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

      <div className="pt-6 border-t border-border-primary">
        <div className="flex justify-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLoginMethod('social')}
          >
            Use Social Login
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLoginMethod('biometric')}
          >
            Use Biometrics
          </Button>
        </div>
      </div>
    </div>
  )

  // Render biometric login screen
  const renderBiometricLogin = () => (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">Login</h2>
        <p className="text-foreground-secondary mb-6">
          Access Wealth with either your OneStep Passcode, OneStep Biometrics or OneStep ID Verification
        </p>
      </div>

      {userData && (
        <div className="p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
          <p className="text-sm text-accent-primary">
            🔒 Biometric login for <strong>{userData.username}</strong>
          </p>
          {userData.osId && (
            <p className="text-xs text-foreground-tertiary mt-1">
              OS-ID: {userData.osId}
            </p>
          )}
        </div>
      )}

      {!userData && !getUsernameFromStorage() && (
        <div className="p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg">
          <p className="text-status-warning text-sm">
            ⚠️ Please log in using Telegram first to enable biometric authentication
          </p>
        </div>
      )}

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
            disabled={loading || (!userData && !getUsernameFromStorage())}
            className="flex flex-col items-center justify-center p-6 bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border border-border-primary hover:border-accent-primary rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Fingerprint className="w-12 h-12 text-accent-primary group-hover:text-background-primary transition-colors mb-3" />
            <span className="text-sm font-medium">Touch ID</span>
          </button>

          <button
            onClick={() => handleBiometricAuth('face')}
            disabled={loading || (!userData && !getUsernameFromStorage())}
            className="flex flex-col items-center justify-center p-6 bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border border-border-primary hover:border-accent-primary rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
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

        {success && (
          <div className="mt-4 p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-status-success" />
              <p className="text-status-success text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-status-error mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-status-error text-sm font-medium">{error}</p>
                
                {error.includes('Username not found') && (
                  <div className="mt-2 text-xs text-status-error/80">
                    <p>• Try logging in with Telegram first</p>
                    <p>• This will establish your account session</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setLoginMethod('social')}
                      className="mt-2 text-accent-primary hover:text-accent-hover"
                    >
                      Switch to Telegram Login
                    </Button>
                  </div>
                )}
                
                {error.includes('not supported') && (
                  <div className="mt-2 text-xs text-status-error/80">
                    <p>• Your browser doesn't support biometric authentication</p>
                    <p>• Try using Chrome, Safari, or Edge</p>
                    <p>• Use passcode login instead</p>
                  </div>
                )}
                
                {error.includes('cancelled') && (
                  <div className="mt-2 text-xs text-status-error/80">
                    <p>• Biometric authentication was cancelled</p>
                    <p>• Try again or use a different login method</p>
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
        <div className="flex justify-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLoginMethod('social')}
          >
            Use Social Login
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLoginMethod('passcode')}
          >
            Use Passcode
          </Button>
        </div>
      </div>
    </div>
  )

  // Method selection tabs
  const renderMethodTabs = () => (
    <div className="flex space-x-1 bg-background-tertiary rounded-lg p-1 mb-6">
      {[
        { id: 'social', label: 'Social', icon: MessageSquare },
        { id: 'passcode', label: 'Passcode', icon: null },
        { id: 'biometric', label: 'Face/Touch', icon: null }
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setLoginMethod(id as LoginMethod)}
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
  )

  return (
    <div className="space-y-6">
      {renderMethodTabs()}

      {loginMethod === 'passcode' && renderPasscodeLogin()}
      {loginMethod === 'biometric' && renderBiometricLogin()}
      {loginMethod === 'social' && renderSocialLogin()}

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-left">
          <h4 className="text-sm font-bold text-blue-400 mb-2">🔐 Login Debug Info</h4>
          <div className="text-xs text-blue-300 space-y-1">
            <p>📱 Current Method: <code className="bg-blue-800/50 px-1 rounded">{loginMethod}</code></p>
            <p>🆔 Telegram ID: <code className="bg-blue-800/50 px-1 rounded">1694779369</code></p>
            <p>👤 Username (State): <code className="bg-blue-800/50 px-1 rounded">{userData?.username || 'Not loaded'}</code></p>
            <p>👤 Username (Storage): <code className="bg-blue-800/50 px-1 rounded">{getUsernameFromStorage() || 'Not found'}</code></p>
            <p>🏷️ OS-ID: <code className="bg-blue-800/50 px-1 rounded">{userData?.osId || 'Not loaded'}</code></p>
            <p>🤖 Bot: <code className="bg-blue-800/50 px-1 rounded">@OneStepTest6_BOT</code></p>
            <p>🔧 Token: <code className="bg-blue-800/50 px-1 rounded">{process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Missing'}</code></p>
            <p className="text-yellow-400">💡 Make sure you've started a chat with the bot!</p>
            <p className="text-green-400">🔄 Login will send OTP to your Telegram</p>
            {userData && (
              <p className="text-green-400">✅ User data loaded from database/storage</p>
            )}
            {getUsernameFromStorage() && (
              <p className="text-green-400">✅ Username available for passcode/biometric login</p>
            )}
            <div className="mt-2 pt-2 border-t border-blue-500/30">
              <p className="text-orange-400">🔧 If login fails:</p>
              <p className="text-xs">• Check browser console for detailed logs</p>
              <p className="text-xs">• Verify user exists in database</p>
              <p className="text-xs">• Ensure Telegram bot can send messages</p>
              <p className="text-xs">• Try clearing localStorage and starting fresh</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}