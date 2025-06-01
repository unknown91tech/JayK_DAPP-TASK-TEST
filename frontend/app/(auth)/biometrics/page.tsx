// app/(auth)/biometrics/page.tsx
"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Fingerprint, 
  Scan, 
  CheckCircle, 
  AlertTriangle,
  Shield,
  Eye,
  Hand,
  Smartphone
} from 'lucide-react'

// Types for biometric setup
interface BiometricMethod {
  id: 'touch' | 'face'
  name: string
  icon: React.ComponentType<any>
  description: string
  isAvailable: boolean
  isRegistered: boolean
}

// Current setup step in the biometric registration process
type SetupStep = 'choose' | 'scanning' | 'complete' | 'verify'

// User data interface for storing username and other info
interface UserData {
  username?: string
  osId?: string
  telegramUserId?: number
  isSetupComplete?: boolean
}

export default function BiometricsSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<SetupStep>('choose')
  const [selectedMethod, setSelectedMethod] = useState<'touch' | 'face' | null>(null)
  const [registrationProgress, setRegistrationProgress] = useState(0)
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false)
  
  // Store user data when we fetch it from the database or localStorage
  const [userData, setUserData] = useState<UserData | null>(null)
  
  // Available biometric methods based on device capabilities
  const [biometricMethods, setBiometricMethods] = useState<BiometricMethod[]>([
    {
      id: 'touch',
      name: 'Touch ID / Fingerprint',
      icon: Fingerprint,
      description: 'Use your fingerprint to securely access your account',
      isAvailable: false,
      isRegistered: false
    },
    {
      id: 'face',
      name: 'Face ID / Face Recognition',
      icon: Scan,
      description: 'Use facial recognition to securely access your account',
      isAvailable: false,
      isRegistered: false
    }
  ])

  // Utility functions for WebAuthn data encoding/decoding (from login.tsx)
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

  // Function to check current session and get user data from server (from login.tsx)
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

  // Function to get username from localStorage (from login.tsx)
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

      // Fourth check: dedicated username storage (from setup-account)
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

  // Function to fetch user data from stored context or session (from login.tsx)
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
          isSetupComplete: false // In setup flow, so not complete yet
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

  // Check WebAuthn support and device capabilities when component loads
  useEffect(() => {
    // Load user data first
    loadUserData().then(setUserData)
    // Then check biometric support
    checkBiometricSupport()
  }, [])

  // Function to check what biometric methods are supported on this device
  const checkBiometricSupport = async () => {
    console.log('🔍 Checking biometric support on this device...')
    
    try {
      // Check if WebAuthn is supported in the browser
      if (!window.PublicKeyCredential) {
        console.log('❌ WebAuthn not supported in this browser')
        setError('Biometric authentication is not supported in this browser. Please use a modern browser like Chrome, Safari, or Edge.')
        return
      }

      setIsWebAuthnSupported(true)
      console.log('✅ WebAuthn is supported')

      // Check for platform authenticator (biometric) availability
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      console.log('🔐 Platform authenticator available:', available)

      if (!available) {
        setError('No biometric authentication methods detected on this device. You may need to set up Touch ID, Face ID, or Windows Hello first.')
        return
      }

      // Update available methods based on user agent (rough detection)
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = /mobile|android|iphone|ipad/.test(userAgent)
      const isApple = /safari|iphone|ipad|mac/.test(userAgent)
      const isWindows = /windows/.test(userAgent)
      const isAndroid = /android/.test(userAgent)

      setBiometricMethods(methods => methods.map(method => {
        if (method.id === 'touch') {
          // Touch ID is available on Apple devices, fingerprint on Android, Windows Hello on Windows
          return {
            ...method,
            isAvailable: isApple || isAndroid || isWindows,
            name: isApple ? 'Touch ID' : isAndroid ? 'touch' : 'Windows Hello'
          }
        }
        if (method.id === 'face') {
          // Face ID is available on newer Apple devices, face unlock on some Android devices
          return {
            ...method,
            isAvailable: isApple || isAndroid,
            name: isApple ? 'Face ID' : 'Face Recognition'
          }
        }
        return method
      }))

      console.log('✅ Biometric support check complete')
      
    } catch (error) {
      console.error('❌ Error checking biometric support:', error)
      setError('Unable to check biometric capabilities. Please ensure your device supports biometric authentication.')
    }
  }

  // Function to handle biometric method selection
  const handleMethodSelection = (methodId: 'touch' | 'face') => {
    console.log(`👆 User selected ${methodId} biometric method`)
    setSelectedMethod(methodId)
    setCurrentStep('scanning')
    setError(null)
    setSuccess(null)
    startBiometricRegistration(methodId)
  }

  // Real biometric registration function (enhanced from login.tsx implementation)
  const startBiometricRegistration = async (method: 'touch' | 'face') => {
    console.log(`🔐 Starting ${method} registration...`)
    setLoading(true)
    setRegistrationProgress(0)
    setError(null)

    try {
      // Check browser support for WebAuthn
      if (!window.PublicKeyCredential) {
        throw new Error('Biometric authentication is not supported in this browser.')
      }

      setSuccess(`Setting up ${method === 'touch' ? 'Touch ID' : 'Face ID'}...`)
      setRegistrationProgress(25)

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
      setRegistrationProgress(50)

      // Create the WebAuthn credential for registration (simplified approach for demo)
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array([1, 2, 3, 4, 5]), // In production: get this from server
        rp: { 
          name: "OneStep",
          id: "localhost" // In production: your domain
        },
        user: {
          id: new TextEncoder().encode(userId), // Use OS-ID or username as user ID
          name: username,
          displayName: displayName
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256 algorithm
          { type: "public-key", alg: -257 } // RS256 algorithm (fallback)
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Use built-in authenticators only
          userVerification: "required", // Require biometric verification
          residentKey: "preferred" // Store credential on device if possible
        },
        timeout: 60000, // 60 seconds to complete registration
        attestation: "none" // Don't request attestation for simplicity
      }

      console.log('🔐 Calling WebAuthn credential creation...')
      setSuccess(`${method === 'touch' ? 'Touch the sensor' : 'Look at the camera'} now!`)
      setRegistrationProgress(75)

      // Create the WebAuthn credential (this will prompt for biometric)
      const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Biometric registration was cancelled or failed')
      }

      console.log('✅ WebAuthn credential created successfully')
      setRegistrationProgress(90)

      // In a real implementation, you would send this to your server for storage
      // For now, we'll just simulate a successful registration
      const credentialData = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        method: method,
        username: username,
        osId: currentUserData?.osId
      }

      console.log('💾 Credential data (would be sent to server):', credentialData)

      // Simulate server registration (in production, send to /api/auth/webauthn/register)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay

      // Mark registration as complete
      setRegistrationProgress(100)
      setCurrentStep('complete')
      setSuccess(`🎉 ${method === 'touch' ? 'Touch ID' : 'Face ID'} setup complete!`)

      // Update the method as registered
      setBiometricMethods(methods => 
        methods.map(m => 
          m.id === method ? { ...m, isRegistered: true } : m
        )
      )

      console.log('✅ Biometric registration complete!')

      // Store successful registration in localStorage for future use
      const registrationData = {
        method: method,
        credentialId: credential.id,
        username: username,
        registeredAt: new Date().toISOString()
      }
      localStorage.setItem('onestep_biometric_data', JSON.stringify(registrationData))

    } catch (error) {
      console.error(`❌ ${method} registration error:`, error)
      setCurrentStep('choose')
      setRegistrationProgress(0)
      
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('aborted')) {
          setError('Biometric registration was cancelled. Please try again.')
        } else if (error.message.includes('not supported')) {
          setError('This biometric method is not supported on your device.')
        } else {
          setError(error.message)
        }
      } else {
        setError('Biometric registration failed. Please try again.')
      }
      setSuccess(null)
    } finally {
      setLoading(false)
    }
  }

  // Function to test/verify a registered biometric method (enhanced from login.tsx)
  const testBiometricAuth = async (method: 'touch' | 'face') => {
    console.log(`🧪 Testing ${method} authentication...`)
    setLoading(true)
    setError(null)
    setCurrentStep('verify')

    try {
      setSuccess(`Testing your ${method === 'touch' ? 'Touch ID' : 'Face ID'}...`)

      // Check if we have registration data
      const registrationData = localStorage.getItem('onestep_biometric_data')
      if (!registrationData) {
        throw new Error('No biometric registration found. Please register first.')
      }

      const regData = JSON.parse(registrationData)
      console.log('🔍 Found registration data:', regData)

      // Create authentication challenge (simplified for demo)
      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: new Uint8Array([1, 2, 3, 4, 5]), // In production: get from server
        allowCredentials: [{
          id: new TextEncoder().encode(regData.credentialId), // Use stored credential ID
          type: 'public-key',
          transports: ['internal']
        }],
        timeout: 60000,
        userVerification: 'required'
      }

      console.log('🔐 Calling WebAuthn for authentication test...')

      // Perform authentication
      const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential

      if (assertion) {
        console.log('✅ Biometric test successful!')
        setSuccess(`✅ ${method === 'touch' ? 'Touch ID' : 'Face ID'} test successful!`)
        setCurrentStep('complete')
        
        // Update localStorage with successful test
        const updatedData = {
          ...regData,
          lastTested: new Date().toISOString(),
          testSuccessful: true
        }
        localStorage.setItem('onestep_biometric_data', JSON.stringify(updatedData))
      } else {
        throw new Error('Authentication test failed')
      }

    } catch (error) {
      console.error('❌ Biometric test failed:', error)
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('aborted')) {
          setError('Biometric test was cancelled.')
        } else {
          setError('Biometric test failed. The registration was successful, but verification had issues.')
        }
      } else {
        setError('Biometric test failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Function to skip biometric setup (user can set it up later)
  const handleSkipSetup = () => {
    console.log('⏭️ User chose to skip biometric setup')
    
    // Store that user skipped biometric setup
    localStorage.setItem('onestep_biometric_skipped', JSON.stringify({
      skippedAt: new Date().toISOString(),
      reason: 'user_choice'
    }))
    
    // Mark setup as complete and redirect to login page (instead of dashboard)
    console.log('🔄 Redirecting to login page...')
    router.push('/login')
  }

  // Function to continue to login after successful setup
  const handleContinue = () => {
    console.log('✅ Biometric setup complete, continuing to login')
    
    // Mark biometric setup as complete
    localStorage.setItem('onestep_setup_complete', JSON.stringify({
      completedAt: new Date().toISOString(),
      biometricEnabled: true,
      method: selectedMethod
    }))
    
    // Redirect to login page (instead of dashboard)
    console.log('🔄 Redirecting to login page...')
    router.push('/login')
  }

  // Render method selection step
  const renderMethodSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Setup Biometric Authentication
        </h2>
        <p className="text-foreground-secondary">
          Add an extra layer of security to your OneStep account with biometric authentication
        </p>
      </div>

      {/* Show user info if we have it loaded from localStorage or session */}
      {userData && (
        <div className="p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
          <p className="text-sm text-accent-primary">
            🔒 Setting up biometrics for <strong>{userData.username}</strong>
          </p>
          {userData.osId && (
            <p className="text-xs text-foreground-tertiary mt-1">
              OS-ID: {userData.osId}
            </p>
          )}
        </div>
      )}

      {/* Security benefits explanation */}
      <div className="p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-xl">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-accent-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-foreground-primary mb-1">
              Enhanced Security
            </h3>
            <p className="text-xs text-foreground-tertiary">
              Biometric authentication provides faster, more secure access to your account using your unique biological features.
            </p>
          </div>
        </div>
      </div>

      {/* Available biometric methods */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground-secondary uppercase tracking-wide">
          Choose your preferred method
        </h3>

        <div className="space-y-3">
          {biometricMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => method.isAvailable && handleMethodSelection(method.id)}
              disabled={!method.isAvailable || loading}
              className={`
                w-full p-4 rounded-xl border transition-all duration-300
                ${method.isAvailable 
                  ? 'bg-background-tertiary hover:bg-accent-primary/10 border-border-primary hover:border-accent-primary cursor-pointer hover:scale-[1.02]' 
                  : 'bg-background-tertiary/50 border-border-primary/50 cursor-not-allowed opacity-60'
                }
                ${method.isRegistered ? 'ring-2 ring-status-success' : ''}
              `}
            >
              <div className="flex items-center space-x-4">
                <div className={`
                  p-3 rounded-lg 
                  ${method.isAvailable 
                    ? 'bg-accent-primary/20 text-accent-primary' 
                    : 'bg-background-secondary text-foreground-tertiary'
                  }
                `}>
                  <method.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-foreground-primary">
                      {method.name}
                    </h4>
                    {method.isRegistered && (
                      <CheckCircle className="w-4 h-4 text-status-success" />
                    )}
                    {!method.isAvailable && (
                      <AlertTriangle className="w-4 h-4 text-status-warning" />
                    )}
                  </div>
                  <p className="text-sm text-foreground-tertiary">
                    {method.isAvailable 
                      ? method.description 
                      : 'Not available on this device'
                    }
                  </p>
                  {method.isRegistered && (
                    <p className="text-xs text-status-success mt-1">
                      ✅ Already registered
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Warning if no methods are available */}
        {!biometricMethods.some(m => m.isAvailable) && (
          <div className="p-4 bg-status-warning/10 border border-status-warning/20 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-status-warning mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-status-warning mb-1">
                  No Biometric Methods Available
                </h4>
                <p className="text-xs text-foreground-tertiary">
                  Your device doesn't support biometric authentication, or it's not set up. 
                  You can still use your passcode to log in securely.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skip option with updated messaging */}
      <div className="pt-6 border-t border-border-primary">
        <div className="text-center space-y-3">
          <p className="text-sm text-foreground-tertiary">
            You can also set this up later in your account settings
          </p>
          <Button 
            variant="ghost" 
            onClick={handleSkipSetup}
            disabled={loading}
          >
            Skip and Continue to Login
          </Button>
        </div>
      </div>
    </div>
  )

  // Render scanning/registration progress step
  const renderScanningStep = () => (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          {selectedMethod === 'touch' ? 'Setting up Touch ID' : 'Setting up Face ID'}
        </h2>
        <p className="text-foreground-secondary">
          Follow the prompts to register your {selectedMethod === 'touch' ? 'touch' : 'face'}
        </p>
      </div>

      {/* Large biometric icon with pulsing animation */}
      <div className="flex justify-center">
        <div className="relative">
          <div className={`
            w-32 h-32 rounded-full flex items-center justify-center
            bg-accent-primary/20 border-4 border-accent-primary/30
            ${loading ? 'animate-pulse' : ''}
          `}>
            {selectedMethod === 'touch' ? (
              <Fingerprint className="w-16 h-16 text-accent-primary" />
            ) : (
              <Scan className="w-16 h-16 text-accent-primary" />
            )}
          </div>
          
          {/* Progress ring */}
          {registrationProgress > 0 && (
            <div className="absolute inset-0">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-accent-primary"
                  strokeDasharray={`${registrationProgress * 3.52} 352`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="w-full bg-background-tertiary rounded-full h-2">
          <div 
            className="bg-accent-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${registrationProgress}%` }}
          />
        </div>
        <p className="text-sm text-foreground-tertiary">
          {registrationProgress}% complete
        </p>
      </div>

      {/* Current step instruction */}
      {success && (
        <div className="p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-xl">
          <p className="text-accent-primary font-medium">{success}</p>
        </div>
      )}

      {/* Cancel button */}
      <Button 
        variant="ghost" 
        onClick={() => {
          setCurrentStep('choose')
          setSelectedMethod(null)
          setRegistrationProgress(0)
          setLoading(false)
        }}
        disabled={loading && registrationProgress > 50} // Don't allow cancel mid-registration
      >
        Cancel
      </Button>
    </div>
  )

  // Render completion step
  const renderCompletionStep = () => (
    <div className="text-center space-y-6">
      <div>
        <CheckCircle className="w-16 h-16 text-status-success mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Biometric Setup Complete!
        </h2>
        <p className="text-foreground-secondary">
          Your {selectedMethod === 'touch' ? 'Touch ID' : 'Face ID'} has been successfully registered
        </p>
      </div>

      {/* Success summary */}
      <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {selectedMethod === 'touch' ? (
            <Fingerprint className="w-5 h-5 text-status-success" />
          ) : (
            <Scan className="w-5 h-5 text-status-success" />
          )}
          <span className="font-medium text-status-success">
            {selectedMethod === 'touch' ? 'Touch ID' : 'Face ID'} Active
          </span>
        </div>
        <p className="text-sm text-foreground-tertiary">
          You can now use your {selectedMethod === 'touch' ? 'touch' : 'face'} to quickly and securely log into your OneStep account.
        </p>
      </div>

      {/* Test biometric button */}
      <div className="space-y-3">
        <Button
          variant="secondary"
          onClick={() => testBiometricAuth(selectedMethod!)}
          disabled={loading}
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          Test {selectedMethod === 'touch' ? 'Touch ID' : 'Face ID'}
        </Button>

        <Button
          variant="primary"
          onClick={handleContinue}
          className="w-full"
        >
          Continue to Login
        </Button>
      </div>

      {/* Setup another method option */}
      {biometricMethods.some(m => m.isAvailable && !m.isRegistered) && (
        <div className="pt-4 border-t border-border-primary">
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentStep('choose')
              setSelectedMethod(null)
              setSuccess(null)
            }}
          >
            Setup Another Method
          </Button>
        </div>
      )}
    </div>
  )

  // Error display component
  const renderError = () => {
    if (!error) return null

    return (
      <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-status-error mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-status-error mb-1">
              Setup Failed
            </h4>
            <p className="text-sm text-foreground-tertiary">{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main render function
  return (
    <div className="space-y-6">
      {/* Progress indicator for multi-step setup - Updated to show 3 steps */}
      <div className="flex items-center justify-center space-x-4 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-status-success text-background-primary flex items-center justify-center text-sm font-medium">✓</div>
          <span className="text-sm text-foreground-secondary">Account Setup</span>
        </div>
        <div className="w-8 h-px bg-border-primary"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-status-success text-background-primary flex items-center justify-center text-sm font-medium">✓</div>
          <span className="text-sm text-foreground-secondary">Passcode</span>
        </div>
        <div className="w-8 h-px bg-border-primary"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-accent-primary text-background-primary flex items-center justify-center text-sm font-medium">3</div>
          <span className="text-sm font-medium text-foreground-primary">Biometrics</span>
        </div>
      </div>

      {/* Error display */}
      {renderError()}

      {/* Render appropriate step based on current state */}
      {currentStep === 'choose' && renderMethodSelection()}
      {currentStep === 'scanning' && renderScanningStep()}
      {(currentStep === 'complete' || currentStep === 'verify') && renderCompletionStep()}

      {/* Development debug panel - Enhanced with real WebAuthn info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-left">
          <h4 className="text-sm font-bold text-blue-400 mb-2">🔒 Biometric Debug Info</h4>
          <div className="text-xs text-blue-300 space-y-1 font-mono">
            <p>🌐 WebAuthn Support: <span className="text-green-400">{isWebAuthnSupported ? 'Yes' : 'No'}</span></p>
            <p>📱 Device Type: <span className="text-yellow-400">{navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</span></p>
            <p>🔄 Current Step: <span className="text-yellow-400">{currentStep}</span></p>
            <p>👆 Selected Method: <span className="text-yellow-400">{selectedMethod || 'None'}</span></p>
            <p>📊 Registration Progress: <span className="text-yellow-400">{registrationProgress}%</span></p>
            <p>👤 Username: <span className="text-yellow-400">{userData?.username || getUsernameFromStorage() || 'Not found'}</span></p>
            <p>🏷️ OS-ID: <span className="text-yellow-400">{userData?.osId || 'Not loaded'}</span></p>
            <p>🔄 Next Redirect: <span className="text-green-400">/login</span></p>
            
            {/* Check for stored biometric data */}
            {(() => {
              const storedBiometric = localStorage.getItem('onestep_biometric_data')
              if (storedBiometric) {
                try {
                  const parsed = JSON.parse(storedBiometric)
                  return (
                    <div className="mt-2 pt-2 border-t border-blue-500/30">
                      <p className="text-green-400">✅ Stored Biometric Data:</p>
                      <p className="ml-2">Method: {parsed.method}</p>
                      <p className="ml-2">Credential ID: {parsed.credentialId}</p>
                      <p className="ml-2">Registered: {new Date(parsed.registeredAt).toLocaleString()}</p>
                      {parsed.lastTested && (
                        <p className="ml-2">Last Tested: {new Date(parsed.lastTested).toLocaleString()}</p>
                      )}
                    </div>
                  )
                } catch (e) {
                  return <p className="text-red-400">❌ Invalid biometric data in storage</p>
                }
              }
              return <p className="text-yellow-400">⚠️ No biometric data stored yet</p>
            })()}
            
            <div className="mt-2 pt-2 border-t border-blue-500/30">
              <p className="text-yellow-400">Available Methods:</p>
              {biometricMethods.map(method => (
                <p key={method.id} className="ml-2">
                  {method.id}: {method.isAvailable ? '✅' : '❌'} {method.isRegistered ? '(Registered)' : ''}
                </p>
              ))}
            </div>
            
            {/* Browser capabilities */}
            <div className="mt-2 pt-2 border-t border-blue-500/30">
              <p className="text-yellow-400">Browser Capabilities:</p>
              <p className="ml-2">PublicKeyCredential: {window.PublicKeyCredential ? '✅' : '❌'}</p>
              <p className="ml-2">User Agent: {navigator.userAgent.substring(0, 50)}...</p>
            </div>
            
            {/* Real WebAuthn test button */}
            <div className="mt-3 pt-2 border-t border-blue-500/30">
              <button 
                onClick={() => {
                  console.log('🧪 Testing WebAuthn support...')
                  if (window.PublicKeyCredential) {
                    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                      .then(available => {
                        console.log('Platform authenticator available:', available)
                        alert(`Platform authenticator available: ${available}`)
                      })
                      .catch(error => {
                        console.error('Error checking platform authenticator:', error)
                        alert(`Error: ${error.message}`)
                      })
                  } else {
                    alert('WebAuthn not supported in this browser')
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
              >
                🧪 Test WebAuthn Support
              </button>
              
              {/* Clear stored data button */}
              <button 
                onClick={() => {
                  localStorage.removeItem('onestep_biometric_data')
                  localStorage.removeItem('onestep_biometric_skipped')
                  localStorage.removeItem('onestep_setup_complete')
                  alert('Cleared all stored biometric data')
                  window.location.reload()
                }}
                className="ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
              >
                🗑️ Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}