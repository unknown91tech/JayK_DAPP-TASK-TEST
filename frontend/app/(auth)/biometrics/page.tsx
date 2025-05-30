// app/(auth)/biometrics/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Fingerprint, 
  Scan, 
  CheckCircle, 
  AlertTriangle,
  Shield,
  Smartphone
} from 'lucide-react'

export default function BiometricsSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [registeredBiometrics, setRegisteredBiometrics] = useState<string[]>([])

  // Utility functions for WebAuthn data conversion
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

  // Register a biometric credential (Touch ID or Face ID)
  const handleBiometricRegistration = async (method: 'touch' | 'face') => {
    console.log(`🔒 Starting ${method} ID registration...`)
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('This browser does not support biometric authentication.')
      }

      setSuccess(`Setting up ${method === 'touch' ? 'Touch ID' : 'Face ID'}...`)

      // Step 1: Get registration challenge from server
      console.log('📡 Getting registration challenge from server...')
      const challengeResponse = await fetch('/api/auth/webauthn/get-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'register', 
          method: method 
        }),
      })

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get registration challenge')
      }

      const challengeData = await challengeResponse.json()
      console.log('✅ Challenge received from server')

      // Step 2: Prepare WebAuthn credential creation options
      const publicKey: PublicKeyCredentialCreationOptions = {
        // Server-generated challenge for this registration
        challenge: base64urlToBuffer(challengeData.challenge),
        
        // Relying Party (our application) information
        rp: {
          name: 'OneStep Authentication', // Display name for our app
          id: process.env.NODE_ENV === 'development' ? 'localhost' : 'yourdomain.com'
        },
        
        // User information (from the challenge response)
        user: {
          id: base64urlToBuffer(challengeData.userId), // Unique user identifier
          name: challengeData.userName || 'onestep_user', // Username
          displayName: challengeData.userDisplayName || 'OneStep User' // Display name
        },
        
        // Supported public key algorithms (ordered by preference)
        pubKeyCredParams: challengeData.pubKeyCredParams || [
          { type: 'public-key', alg: -7 }, // ES256 (Elliptic Curve)
          { type: 'public-key', alg: -257 } // RS256 (RSA)
        ],
        
        // Registration options
        timeout: challengeData.timeout || 60000, // 60 seconds to complete
        attestation: challengeData.attestation || 'none', // No attestation needed
        
        // Authenticator selection criteria
        authenticatorSelection: {
          // Only use built-in authenticators (Touch ID, Face ID, Windows Hello)
          authenticatorAttachment: 'platform',
          // Require user verification (biometric scan, not just device unlock)
          userVerification: 'required',
          // Don't require resident keys (credentials stored on device)
          requireResidentKey: false
        },
        
        // Exclude any existing credentials to prevent duplicates
        excludeCredentials: [] // In production, you'd list existing credential IDs here
      }

      // Step 3: Call WebAuthn to create the new credential
      console.log('👆 Requesting biometric registration from device...')
      setSuccess(`Please complete ${method === 'touch' ? 'Touch ID' : 'Face ID'} setup on your device...`)
      
      const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Biometric registration was cancelled or failed.')
      }

      console.log('✅ Biometric credential created successfully')

      // Step 4: Extract registration response data
      const response = credential.response as AuthenticatorAttestationResponse
      
      const registrationData = {
        id: credential.id, // Credential ID (unique identifier)
        rawId: bufferToBase64url(credential.rawId), // Raw credential ID
        response: {
          attestationObject: bufferToBase64url(response.attestationObject), // Contains public key
          clientDataJSON: bufferToBase64url(response.clientDataJSON) // Client context data
        },
        type: credential.type, // Should be "public-key"
        deviceType: method, // Store which biometric type this is
        deviceName: `${method === 'touch' ? 'Touch ID' : 'Face ID'} - ${navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Device'}`
      }

      // Step 5: Send the credential to our server for storage
      console.log('📤 Sending credential to server for storage...')
      setSuccess('Saving your biometric credential...')
      
      const registerResponse = await fetch('/api/auth/webauthn/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // In a real app, you'd include authentication headers here
          'x-user-id': 'current-user-id' // This would come from your session
        },
        body: JSON.stringify(registrationData)
      })

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save biometric credential')
      }

      const registerResult = await registerResponse.json()
      console.log('✅ Biometric credential saved successfully:', registerResult)

      // Step 6: Update UI state
      setRegisteredBiometrics(prev => [...prev, method])
      setSuccess(`✅ ${method === 'touch' ? 'Touch ID' : 'Face ID'} setup complete!`)
      
      // Clear success message after a delay
      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      console.error(`❌ ${method} ID registration error:`, err)
      
      // Provide user-friendly error messages
      let errorMessage = `Failed to set up ${method === 'touch' ? 'Touch ID' : 'Face ID'}.`
      
      if (err instanceof Error) {
        if (err.message.includes('not supported')) {
          errorMessage = 'Your browser or device does not support biometric authentication.'
        } else if (err.message.includes('cancelled')) {
          errorMessage = 'Biometric setup was cancelled. Please try again.'
        } else if (err.message.includes('challenge')) {
          errorMessage = 'Setup failed. Please refresh the page and try again.'
        } else if (err.message.includes('already registered')) {
          errorMessage = 'This biometric method is already set up.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      setSuccess(null)
    } finally {
      setLoading(false)
    }
  }

  // Skip biometric setup (optional step)
  const handleSkipBiometrics = () => {
    console.log('⏭️ Skipping biometric setup')
    router.push('/dashboard')
  }

  // Continue after setting up at least one biometric
  const handleContinue = () => {
    console.log('✅ Biometric setup complete, continuing to dashboard')
    router.push('/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Set up Biometrics
        </h2>
        <p className="text-foreground-secondary">
          Add Touch ID or Face ID for quick and secure access to your account
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-4 py-4">
        <div className="flex items-center space-x-2">
          <div className="progress-step completed">
            ✓
          </div>
          <span className="text-sm text-foreground-secondary">Account Setup</span>
        </div>
        <div className="w-8 h-px bg-border-primary"></div>
        <div className="flex items-center space-x-2">
          <div className="progress-step completed">
            ✓
          </div>
          <span className="text-sm text-foreground-secondary">Passcode</span>
        </div>
        <div className="w-8 h-px bg-border-primary"></div>
        <div className="flex items-center space-x-2">
          <div className="progress-step active">
            3
          </div>
          <span className="text-sm font-medium text-foreground-primary">Biometrics</span>
        </div>
      </div>

      {/* Biometric setup section */}
      <div className="space-y-8">
        {/* Security benefits explanation */}
        <div className="p-4 bg-background-tertiary/50 rounded-xl border border-border-primary">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-accent-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-foreground-primary mb-2">Enhanced Security</h3>
              <p className="text-xs text-foreground-tertiary leading-relaxed">
                Biometric authentication adds an extra layer of security to your account. 
                Your biometric data never leaves your device and cannot be intercepted or stolen.
              </p>
            </div>
          </div>
        </div>

        {/* Biometric options */}
        <div>
          <h3 className="text-lg font-semibold text-foreground-primary mb-4 text-center">
            Choose your preferred biometric method
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md mx-auto">
            {/* Touch ID Option */}
            <div className="relative">
              <button
                onClick={() => handleBiometricRegistration('touch')}
                disabled={loading || registeredBiometrics.includes('touch')}
                className={`
                  w-full flex flex-col items-center justify-center p-8 
                  border-2 rounded-xl transition-all duration-300
                  ${registeredBiometrics.includes('touch')
                    ? 'bg-status-success/10 border-status-success text-status-success'
                    : 'bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border-border-primary hover:border-accent-primary'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:shadow-xl'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {registeredBiometrics.includes('touch') ? (
                  <CheckCircle className="w-12 h-12 mb-3" />
                ) : (
                  <Fingerprint className="w-12 h-12 mb-3" />
                )}
                <span className="text-sm font-medium">Touch ID</span>
                <span className="text-xs mt-1 opacity-80">
                  {registeredBiometrics.includes('touch') ? 'Set up ✓' : 'Fingerprint'}
                </span>
              </button>
            </div>

            {/* Face ID Option */}
            <div className="relative">
              <button
                onClick={() => handleBiometricRegistration('face')}
                disabled={loading || registeredBiometrics.includes('face')}
                className={`
                  w-full flex flex-col items-center justify-center p-8 
                  border-2 rounded-xl transition-all duration-300
                  ${registeredBiometrics.includes('face')
                    ? 'bg-status-success/10 border-status-success text-status-success'
                    : 'bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border-border-primary hover:border-accent-primary'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:shadow-xl'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {registeredBiometrics.includes('face') ? (
                  <CheckCircle className="w-12 h-12 mb-3" />
                ) : (
                  <Scan className="w-12 h-12 mb-3" />
                )}
                <span className="text-sm font-medium">Face ID</span>
                <span className="text-xs mt-1 opacity-80">
                  {registeredBiometrics.includes('face') ? 'Set up ✓' : 'Facial recognition'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center">
            <div className="inline-flex items-center text-accent-primary">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Setting up biometric authentication...
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-status-success" />
              <p className="text-status-success text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-status-error" />
              <p className="text-status-error text-sm font-medium">{error}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="mt-2 w-full"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={handleSkipBiometrics}
            className="flex-1"
            disabled={loading}
          >
            Skip for Now
          </Button>
          
          {registeredBiometrics.length > 0 ? (
            <Button
              variant="primary"
              onClick={handleContinue}
              className="flex-1"
              disabled={loading}
            >
              Continue to Dashboard
            </Button>
          ) : (
            <Button
              variant="primary"
              className="flex-1 opacity-50 cursor-not-allowed"
              disabled={true}
            >
              Set up at least one method
            </Button>
          )}
        </div>

        {/* Information note */}
        <div className="p-4 bg-background-tertiary/50 rounded-xl border border-border-primary">
          <div className="flex items-start space-x-2">
            <Smartphone className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground-primary mb-1">Device Compatibility:</p>
              <ul className="text-xs text-foreground-tertiary space-y-1">
                <li>• Touch ID: Available on supported devices with fingerprint sensors</li>
                <li>• Face ID: Available on devices with facial recognition cameras</li>
                <li>• Your biometric data is stored securely on your device only</li>
                <li>• You can set up multiple biometric methods for convenience</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Development debug panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg text-left">
          <h4 className="text-sm font-bold text-purple-400 mb-2">🔒 Biometric Setup Debug</h4>
          <div className="text-xs text-purple-300 space-y-1">
            <p>📱 WebAuthn Support: {typeof window !== 'undefined' && window.PublicKeyCredential ? '✅' : '❌'}</p>
            <p>🔑 Registered: {registeredBiometrics.join(', ') || 'None'}</p>
            <p>🌐 Origin: {typeof window !== 'undefined' ? window.location.origin : 'Unknown'}</p>
            <p className="text-yellow-400">💡 Biometric data is stored in your database for authentication</p>
          </div>
        </div>
      )}
    </div>
  )
}