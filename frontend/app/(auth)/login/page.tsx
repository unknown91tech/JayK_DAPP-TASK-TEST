'use client'

import { useState } from 'react'
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

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('social')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Handle social login (Telegram)
  const handleSocialLogin = async () => {
    console.log('🚀 Starting Telegram login with real ID: 1694779369')
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
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
          firstName: 'User',
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
        firstName: 'User',
        lastName: '',
        username: 'existing_user',
        identifier: `telegram_1694779369`,
        purpose: 'LOGIN',
        telegramSent: otpData.telegramSent,
        isLogin: true,
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

  // Handle passcode login
  const handlePasscodeComplete = async (passcode: string) => {
    console.log('🔐 Verifying passcode login...')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/passcode/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Passcode login successful!')
        router.push('/dashboard')
      } else {
        const data = await response.json()
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

      // Step 1: Fetch the authentication challenge from the server
      // const challengeResponse = await fetch('/api/auth/webauthn/get-challenge', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ type: 'login', method }),
      // })

      // if (!challengeResponse.ok) {
      //   const errorData = await challengeResponse.json().catch(() => ({}))
      //   throw new Error(errorData.error || 'Failed to fetch authentication challenge.')
      // }

      // const challengeData = await challengeResponse.json()
      // const { challenge, userId, credentialId } = challengeData

      // if (!challenge || !userId || !credentialId) {
      //   throw new Error('Invalid challenge data received from server.')
      // }

      const publicKey = {
        challenge: new Uint8Array([1, 2, 3, 4, 5]), // Replace with a real server-generated challenge
        rp: { name: "localhost" }, // Relying Party (your app)
        user: {
          id: new Uint8Array([1, 2, 3, 4]), // Unique user ID
          name: "telegram_1694779369",
          displayName: "telegram_1694779369"
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256 algorithm
        authenticatorSelection: { userVerification: "required" } // Enforce biometrics
      };
      const credential = await navigator.credentials.create({ publicKey });
      console.log(credential, publicKey);
      // Step 2: Prepare the WebAuthn assertion options
      // const publicKey: PublicKeyCredentialRequestOptions = {
      //   challenge: base64urlToBuffer(challenge),
      //   allowCredentials: [
      //     {
      //       id: base64urlToBuffer(credentialId),
      //       type: 'public-key',
      //       transports: method === 'touch' ? ['internal'] : ['internal', 'hybrid'],
      //     },
      //   ],
      //   timeout: 60000,
      //   userVerification: 'required',
      // }

      // Step 3: Call WebAuthn to authenticate
      const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential

      if (!assertion) {
        throw new Error('Biometric authentication was cancelled or failed.')
      }

      // Step 4: Extract the necessary data from the assertion
      // const authData = (assertion.response as AuthenticatorAssertionResponse).authenticatorData
      // const clientDataJSON = (assertion.response as AuthenticatorAssertionResponse).clientDataJSON
      // const signature = (assertion.response as AuthenticatorAssertionResponse).signature
      // const userHandle = (assertion.response as AuthenticatorAssertionResponse).userHandle

      // Step 5: Send the assertion to the server for verification
      // const verifyResponse = await fetch('/api/auth/webauthn/verify-assertion', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     id: assertion.id,
      //     rawId: bufferToBase64url(assertion.rawId),
      //     response: {
      //       authenticatorData: bufferToBase64url(authData),
      //       clientDataJSON: bufferToBase64url(clientDataJSON),
      //       signature: bufferToBase64url(signature),
      //       userHandle: userHandle ? bufferToBase64url(userHandle) : null,
      //     },
      //     type: assertion.type,
      //   }),
      // })

      // if (!verifyResponse.ok) {
      //   const errorData = await verifyResponse.json().catch(() => ({}))
      //   throw new Error(errorData.error || 'Biometric authentication failed.')
      // }

      // const verifyData = await verifyResponse.json()
      // console.log(`✅ ${method} ID authentication successful:`, verifyData)
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

  // Render social login screen
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

        {success && (
          <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-status-success" />
              <p className="text-status-success text-sm">{success}</p>
            </div>
          </div>
        )}

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

  // Render passcode login screen
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
          <div className="mt-4 p-3 bg-status-success/10 border border-status-success/20 rounded-lg">
            <p className="text-status-success text-sm">{success}</p>
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

  // Main render
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
            <p>📱 Current Method: <code>{loginMethod}</code></p>
            <p>🆔 Telegram ID: <code>1694779369</code></p>
            <p>🤖 Bot: @OneStepTest6_BOT</p>
            <p className="text-yellow-400">💡 Make sure you've started a chat with the bot!</p>
            <p className="text-green-400">🔄 Login will send OTP to your Telegram</p>
          </div>
        </div>
      )}
    </div>
  )
}