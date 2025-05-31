'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PasscodeInput } from '@/components/ui/passcode-input'
import { 
  Fingerprint, 
  Scan, 
  MessageSquare,
  Smartphone,
  HelpCircle,
  CheckCircle
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
    // Add padding if needed (base64 URL encoding removes padding)
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
    // Convert ArrayBuffer to base64 URL encoding
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
      
      // Check if user has an active session (from previous login or account setup)
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include' // Include cookies for session check
      })

      if (response.ok) {
        const sessionData = await response.json()
        console.log('✅ Active session found:', sessionData)
        
        if (sessionData.authenticated && sessionData.user) {
          return {
            username: sessionData.user.username,
            osId: sessionData.user.osId,
            isSetupComplete: sessionData.user.isSetupComplete,
            telegramUserId: 1694779369 // We know this is their Telegram ID
          }
        }
      } else if (response.status === 403) {
        // 403 means user has session but setup incomplete - that's still valuable info!
        console.log('⚠️ Session exists but setup incomplete, trying to extract user data...')
        
        // Try to get user data from the session cookie directly
        // Since middleware blocks incomplete users, we'll decode the JWT client-side
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('onestep-session='))
          ?.split('=')[1]
        
        if (sessionCookie) {
          try {
            // Decode JWT payload (this is safe since it's just reading, not verifying)
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
      
      // First check: login context (if user started login process)
      const loginContext = localStorage.getItem('telegram_login_temp')
      if (loginContext) {
        const parsed = JSON.parse(loginContext)
        if (parsed.username) {
          console.log('📋 Found username in login context:', parsed.username)
          return parsed.username
        }
      }

      // Second check: signup context (if user just completed signup)
      const signupContext = localStorage.getItem('telegram_signup_temp')
      if (signupContext) {
        const parsed = JSON.parse(signupContext)
        if (parsed.username) {
          console.log('📋 Found username in signup context:', parsed.username)
          return parsed.username
        }
      }

      // Third check: user data context (general user data storage)
      const userDataContext = localStorage.getItem('telegram_user_temp')
      if (userDataContext) {
        const parsed = JSON.parse(userDataContext)
        if (parsed.username) {
          console.log('📋 Found username in user data context:', parsed.username)
          return parsed.username
        }
      }

      // Fourth check: dedicated username storage
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
      // First, check if we have an active session (user might have just completed setup)
      const sessionUserData = await checkUserSession()
      if (sessionUserData) {
        console.log('✅ Got user data from active session')
        return sessionUserData
      }

      // If no session, try to get username from localStorage
      const storedUsername = getUsernameFromStorage()
      if (storedUsername) {
        // Build user data from localStorage information
        const userData: UserData = {
          username: storedUsername,
          telegramUserId: 1694779369, // Known Telegram ID
          isSetupComplete: true // Assume setup is complete if they have a username
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
    // Load user data on component mount to display personalized login options
    loadUserData().then(setUserData)
  }, [])

  // Handle social login (Telegram) - Enhanced to fetch user data
  const handleSocialLogin = async () => {
    console.log('🚀 Starting Telegram login with real ID: 1694779369')
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Step 0: Check if user has an active session (from recent signup/login)
      console.log('🔍 Step 0: Checking for existing user session...')
      const existingUserData = await checkUserSession()
      
      if (existingUserData) {
        console.log('✅ Found existing user session:', existingUserData)
        setUserData(existingUserData) // Store user data for biometric auth later
      } else {
        console.log('⚠️ No existing session found - user may need to sign up first')
        // Don't error here - they might be a returning user without active session
      }

      // Step 1: Check if user exists via Telegram OAuth simulation
      console.log('⏳ Step 1: Telegram OAuth for login...')
      setSuccess('Connecting to Telegram...')
      
      const oauthResponse = await fetch('/api/auth/telegram/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authData: 'existing_telegram_user',
          timestamp: Date.now(),
          loginFlow: true
        })
      })

      if (!oauthResponse.ok) {
        const errorData = await oauthResponse.json()
        throw new Error(errorData.error || 'Telegram login failed')
      }

      const oauthData = await oauthResponse.json()
      console.log('✅ Step 1 complete:', oauthData)

      // Step 2: Send login OTP via Telegram
      console.log('⏳ Step 2: Sending login OTP to your Telegram (ID: 1694779369)...')
      setSuccess('Sending login code to your Telegram...')
      
      const otpResponse = await fetch('/api/auth/telegram/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramUserId: 1694779369,
          firstName: existingUserData?.username || 'User', // Use session username if available
          identifier: `telegram_1694779369`,
          purpose: 'LOGIN'
        })
      })

      if (!otpResponse.ok) {
        const errorData = await otpResponse.json()
        throw new Error(errorData.error || 'Failed to send login OTP')
      }

      const otpData = await otpResponse.json()
      console.log('✅ Step 2 complete:', otpData)

      // Step 3: Store login context for OTP verification
      const loginContext = {
        telegramUserId: 1694779369,
        firstName: existingUserData?.username || 'User',
        lastName: '',
        username: existingUserData?.username || 'existing_user',
        osId: existingUserData?.osId,
        identifier: `telegram_1694779369`,
        purpose: 'LOGIN',
        telegramSent: otpData.telegramSent,
        isLogin: true,
        isSetupComplete: existingUserData?.isSetupComplete,
        ...(otpData.devOTP && { devOTP: otpData.devOTP })
      }

      localStorage.setItem('telegram_login_temp', JSON.stringify(loginContext))
      console.log('💾 Login context stored:', loginContext)

      // Show success message
      if (otpData.telegramSent) {
        setSuccess('✅ Login code sent to your Telegram! Check your messages.')
      } else {
        setSuccess('✅ Login code generated! Check console for development code.')
      }

      // Step 4: Redirect to OTP verification
      setTimeout(() => {
        console.log('✅ Redirecting to login OTP verification...')
        router.push('/verify-otp')
      }, 2000)

    } catch (err) {
      console.error('❌ Login error:', err)
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
      setSuccess(null)
    } finally {
      setLoading(false)
    }
  }

  // Handle passcode login - Enhanced to use username from localStorage
  const handlePasscodeComplete = async (passcode: string) => {
    console.log('🔐 Verifying passcode login...')
    setLoading(true)
    setError(null)

    try {
      // Get username from localStorage or userData state
      let username = userData?.username || getUsernameFromStorage()
      
      if (!username) {
        setError('Username not found. Please log in using Telegram first.')
        setLoading(false)
        return
      }

      console.log('👤 Using username for passcode verification:', username)

      // For passcode login, we need to bypass the middleware that blocks incomplete setup
      // We'll use a special header to indicate this is a login attempt, not a regular API call
      const response = await fetch('/api/auth/passcode/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Send username as a custom header so the API can identify the user
          'x-username': username,
          // Special header to indicate this is a login flow (helps bypass middleware)
          'x-login-flow': 'true',
          // Create a simple pre-auth token (in production, this should be properly signed)
          'x-pre-auth': btoa(JSON.stringify({
            username: username,
            timestamp: Date.now(),
            purpose: 'passcode_login'
          }))
        },
        body: JSON.stringify({ 
          passcode,
          username // Also include in body for additional verification
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Passcode login successful!')
        
        // Store successful login data
        if (data.user) {
          const loginData = {
            username: data.user.username,
            osId: data.user.osId,
            loginMethod: 'passcode',
            loginTime: new Date().toISOString()
          }
          localStorage.setItem('onestep_login_data', JSON.stringify(loginData))
          
          // Update our state with the returned user data
          setUserData({
            username: data.user.username,
            osId: data.user.osId,
            isSetupComplete: true, // Assume complete if passcode login worked
            telegramUserId: 1694779369
          })
        }

        // Show success message briefly before redirect
        setSuccess('✅ Passcode verified! Redirecting to dashboard...')
        
        // Redirect to dashboard after a short delay
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

  // Handle biometric authentication using WebAuthn - Enhanced with database username
  const handleBiometricAuth = async (method: 'touch' | 'face') => {
    console.log(`🔒 Starting ${method} ID authentication...`)
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Check browser support for WebAuthn
      if (!window.PublicKeyCredential) {
        throw new Error('Biometric authentication is not supported in this browser.')
      }

      setSuccess(`Authenticating with ${method === 'touch' ? 'Touch ID' : 'Face ID'}...`)

      // If we don't have user data, try to load it first
      let currentUserData = userData
      if (!currentUserData) {
        console.log('🔍 No user data available, checking session...')
        currentUserData = await loadUserData()
        if (currentUserData) {
          setUserData(currentUserData)
        }
      }

      // Get username from session or localStorage
      const username = currentUserData?.username || getUsernameFromStorage() || 'telegram_1694779369'
      const displayName = currentUserData?.username || 'OneStep User'
      const userId = currentUserData?.osId || 'telegram_1694779369'

      console.log('👤 Using username from session/localStorage:', username)

      // Step 1: Fetch the authentication challenge from the server
      const challengeResponse = await fetch('/api/auth/webauthn/get-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'login', 
          method,
          username: username, // Pass the username from session/localStorage
          osId: currentUserData?.osId // Also pass the OS-ID if available
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

      // Step 2: Prepare the WebAuthn assertion options with real data
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64urlToBuffer(challenge),
        allowCredentials: credentialId ? [
          {
            id: base64urlToBuffer(credentialId),
            type: 'public-key',
            transports: method === 'touch' ? ['internal'] : ['internal', 'hybrid'],
          }
        ] : [], // Empty array if no credential ID (first time setup)
        timeout: 60000,
        userVerification: 'required', // Require biometric verification
      }

      console.log('🔐 Calling WebAuthn for authentication...')

      // Step 3: Call WebAuthn to authenticate
      const assertion = await navigator.credentials.get({ 
        publicKey: publicKeyCredentialRequestOptions 
      }) as PublicKeyCredential

      if (!assertion) {
        throw new Error('Biometric authentication was cancelled or failed.')
      }

      console.log('✅ WebAuthn assertion received')

      // Step 4: Extract the necessary data from the assertion
      const authData = (assertion.response as AuthenticatorAssertionResponse).authenticatorData
      const clientDataJSON = (assertion.response as AuthenticatorAssertionResponse).clientDataJSON
      const signature = (assertion.response as AuthenticatorAssertionResponse).signature
      const userHandle = (assertion.response as AuthenticatorAssertionResponse).userHandle

      // Step 5: Send the assertion to the server for verification
      const verifyResponse = await fetch('/api/auth/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assertion.id,
          rawId: bufferToBase64url(assertion.rawId),
          response: {
            authenticatorData: bufferToBase64url(authData),
            clientDataJSON: bufferToBase64url(clientDataJSON),
            signature: bufferToBase64url(signature),
            userHandle: userHandle ? bufferToBase64url(userHandle) : null,
          },
          type: assertion.type,
          username: username, // Include username in verification
          osId: currentUserData?.osId // Include OS-ID for verification
        }),
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Biometric authentication failed.')
      }

      const verifyData = await verifyResponse.json()
      console.log(`✅ ${method} ID authentication successful:`, verifyData)
      setSuccess(`✅ ${method === 'touch' ? 'Touch ID' : 'Face ID'} authentication successful!`)

      // Step 6: Redirect to dashboard on success
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

      {/* Show user info if we have it loaded from localStorage or session */}
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
              ⚠️ Account setup incomplete - you can still log in with passcode
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
          
          {/* Telegram login button with loading state */}
          <button
            onClick={handleSocialLogin}
            disabled={loading}
            className={`
              w-16 h-16 mx-auto flex items-center justify-center 
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
              <MessageSquare className="w-8 h-8" />
            )}
          </button>
          
          <p className="text-xs text-accent-primary mt-2">Recovery Center</p>
        </div>

        {/* Success message display */}
        {success && (
          <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-status-success" />
              <p className="text-status-success text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Error message display */}
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

  // Render passcode login screen - Enhanced with username verification
  const renderPasscodeLogin = () => (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">Login</h2>
        <p className="text-foreground-secondary mb-6">
          Access Wealth with either your OneStep Passcode, OneStep Biometrics or OneStep ID Verification
        </p>
      </div>

      {/* Show user info if available from localStorage or session */}
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

      {/* Show warning if no username found */}
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

        {/* Passcode input component */}
        <PasscodeInput
          onComplete={handlePasscodeComplete}
          error={!!error}
          loading={loading}
          disabled={!userData && !getUsernameFromStorage()} // Disable if no username available
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

      {/* Error display for passcode issues */}
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

      {/* Show user info if available */}
      {userData && (
        <div className="p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
          <p className="text-sm text-accent-primary">
            🔒 Biometric login for <strong>{userData.username}</strong>
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

        {/* Biometric method selection */}
        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
          <button
            onClick={() => handleBiometricAuth('touch')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border border-border-primary hover:border-accent-primary rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl disabled:opacity-50"
          >
            <Fingerprint className="w-12 h-12 text-accent-primary group-hover:text-background-primary transition-colors mb-3" />
            <span className="text-sm font-medium">Touch ID</span>
          </button>

          <button
            onClick={() => handleBiometricAuth('face')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border border-border-primary hover:border-accent-primary rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl disabled:opacity-50"
          >
            <Scan className="w-12 h-12 text-accent-primary group-hover:text-background-primary transition-colors mb-3" />
            <span className="text-sm font-medium">Face ID</span>
          </button>
        </div>

        {/* Loading state during biometric authentication */}
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

        {/* Success message for biometric authentication */}
        {success && (
          <div className="mt-4 p-3 bg-status-success/10 border border-status-success/20 rounded-lg">
            <p className="text-status-success text-sm">{success}</p>
          </div>
        )}

        {/* Error message for biometric authentication */}
        {error && (
          <div className="mt-4 p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
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

  // Method selection tabs - allows users to switch between login methods
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

  // Main render - shows the appropriate login method based on user selection
  return (
    <div className="space-y-6">
      {/* Tab navigation for switching between login methods */}
      {renderMethodTabs()}

      {/* Render the appropriate login screen based on selected method */}
      {loginMethod === 'passcode' && renderPasscodeLogin()}
      {loginMethod === 'biometric' && renderBiometricLogin()}
      {loginMethod === 'social' && renderSocialLogin()}

      {/* Development debug panel - only shows in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-left">
          <h4 className="text-sm font-bold text-blue-400 mb-2">🔐 Login Debug Info</h4>
          <div className="text-xs text-blue-300 space-y-1">
            <p>📱 Current Method: <code>{loginMethod}</code></p>
            <p>🆔 Telegram ID: <code>1694779369</code></p>
            <p>👤 Username (State): <code>{userData?.username || 'Not loaded'}</code></p>
            <p>👤 Username (Storage): <code>{getUsernameFromStorage() || 'Not found'}</code></p>
            <p>🏷️ OS-ID: <code>{userData?.osId || 'Not loaded'}</code></p>
            <p>🤖 Bot: @OneStepTest6_BOT</p>
            <p className="text-yellow-400">💡 Make sure you've started a chat with the bot!</p>
            <p className="text-green-400">🔄 Login will send OTP to your Telegram</p>
            {userData && (
              <p className="text-green-400">✅ User data loaded from database/storage</p>
            )}
            {getUsernameFromStorage() && (
              <p className="text-green-400">✅ Username available for passcode login</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}