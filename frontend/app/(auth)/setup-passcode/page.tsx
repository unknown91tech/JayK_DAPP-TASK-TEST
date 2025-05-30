// app/(auth)/setup-passcode/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PasscodeInput } from '@/components/ui/passcode-input'
import { Input } from '@/components/ui/input'

export default function SetupPasscodePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passcode, setPasscode] = useState('')
  const [avvChecking, setAvvChecking] = useState(false)

  // Handle when user completes entering their 6-digit passcode
  const handlePasscodeComplete = async (newPasscode: string) => {
    console.log('🔐 User completed passcode entry, starting validation...')
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Step 1: First validate the passcode with our AVV (Auto-Verification & Validation) system
      console.log('⏳ Step 1: Running AVV security checks...')
      setAvvChecking(true)
      
      const avvResponse = await fetch('/api/security/avv', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include session cookies
        body: JSON.stringify({ 
          checkType: 'PASSCODE_STRENGTH',
          input: newPasscode
        })
      })

      console.log('📡 AVV response status:', avvResponse.status)
      const avvResult = await avvResponse.json()
      console.log('📦 AVV result:', avvResult)

      setAvvChecking(false)

      // If AVV security check fails, show the specific reason to help user
      if (!avvResponse.ok || avvResult.result === 'FAIL') {
        console.log('❌ AVV check failed:', avvResult.reason)
        setError(avvResult.reason || 'Passcode does not meet security requirements')
        return
      }

      console.log('✅ AVV checks passed, proceeding to create passcode...')

      // Step 2: If security validation passes, create and store the passcode
      console.log('⏳ Step 2: Creating passcode in database...')
      const response = await fetch('/api/auth/passcode/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies for user identification
        body: JSON.stringify({ passcode: newPasscode })
      })

      console.log('📡 Passcode creation response status:', response.status)
      const result = await response.json()
      console.log('📦 Passcode creation result:', result)

      if (response.ok && result.success) {
        console.log('✅ Passcode created successfully!')
        setSuccess('✅ Passcode created successfully! Proceeding to biometric setup...')
        
        // Small delay to show success message, then move to next step
        setTimeout(() => {
          console.log('🔄 Redirecting to biometrics setup...')
          router.push('/login')
        }, 1500)
      } else {
        console.log('❌ Passcode creation failed:', result.error)
        setError(result.error || result.message || 'Failed to create passcode. Please try again.')
      }
    } catch (err) {
      console.error('❌ Network or other error:', err)
      setError('Failed to create passcode. Please check your connection and try again.')
    } finally {
      setLoading(false)
      setAvvChecking(false)
    }
  }

  // Go back to the previous step (account setup)
  const handlePrevious = () => {
    console.log('🔙 User clicked Previous, going back to account setup')
    router.back()
  }

  // Manual proceed button handler (when user types in the input field)
  const handleManualProceed = () => {
    if (passcode.length === 6) {
      console.log('👆 User clicked Proceed button with passcode:', passcode)
      handlePasscodeComplete(passcode)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section with instructions */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Setup your Passcode
        </h2>
        <p className="text-foreground-secondary">
          Create a secure 6-digit passcode to protect your OneStep account from unauthorized access
        </p>
      </div>

      {/* Progress indicator showing current step */}
      <div className="flex items-center justify-center space-x-4 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-status-success text-background-primary flex items-center justify-center text-sm font-medium">
            ✓
          </div>
          <span className="text-sm text-foreground-secondary">Account Setup</span>
        </div>
        <div className="w-8 h-px bg-border-primary"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-accent-primary text-background-primary flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm font-medium text-foreground-primary">Setup Passcode</span>
        </div>
      </div>

      {/* Success message display */}
      {success && (
        <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl animate-slide-up">
          <p className="text-status-success text-sm text-center">{success}</p>
        </div>
      )}

      {/* Main passcode setup section */}
      <div className="space-y-8">
        {/* Traditional input field option */}
        <div>
          <label className="block text-sm font-medium text-foreground-primary mb-4">
            CREATE YOUR 6-DIGIT PASSCODE
          </label>
          <Input
            placeholder="••••••"
            type="password"
            maxLength={6}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            value={passcode}
            onChange={(e) => {
              // Only allow numbers and limit to 6 digits
              const value = e.target.value.replace(/\D/g, '').slice(0, 6)
              setPasscode(value)
              console.log(`📝 User typed passcode: ${value} (${value.length}/6 digits)`)
              
              // Auto-submit when 6 digits are entered
              if (value.length === 6) {
                console.log('🎯 6 digits entered, auto-submitting...')
                handlePasscodeComplete(value)
              }
            }}
            disabled={loading}
          />
          <p className="text-xs text-foreground-tertiary mt-2">
            💡 Your passcode will be automatically submitted when you enter 6 digits
          </p>
        </div>

        {/* Alternative: Secure dots interface (more user-friendly) */}
        <div className="text-center">
          <p className="text-sm text-foreground-secondary mb-4">
            Or use the secure passcode interface:
          </p>
          <PasscodeInput
            onComplete={handlePasscodeComplete}
            onChange={setPasscode}
            error={!!error}
            loading={loading || avvChecking}
          />
          
          {/* Show what's happening during validation */}
          {avvChecking && (
            <p className="text-sm text-accent-primary mt-2 animate-pulse">
              🔍 Checking passcode security...
            </p>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            className="flex-1"
            disabled={loading || avvChecking}
          >
            ← Previous
          </Button>
          <Button
            variant="primary"
            onClick={handleManualProceed}
            className="flex-1"
            disabled={passcode.length !== 6 || loading || avvChecking}
            loading={loading || avvChecking}
          >
            {loading || avvChecking ? 'Creating Passcode...' : 'Proceed →'}
          </Button>
        </div>

        {/* Error display with helpful feedback */}
        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl animate-slide-up">
            <p className="text-status-error text-sm">{error}</p>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setError(null)
                setPasscode('') // Clear the passcode to let user try again
              }}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Security requirements and tips */}
        <div className="p-4 bg-background-tertiary/50 rounded-xl border border-border-primary">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground-primary mb-1">Security Requirements:</p>
              <ul className="text-xs text-foreground-tertiary space-y-1">
                <li>• Must be exactly 6 digits (0-9 only)</li>
                <li>• Cannot be related to your date of birth</li>
                <li>• Avoid obvious patterns like 123456 or 111111</li>
                <li>• Use a mix of different numbers for better security</li>
                <li>• Will be verified by our Auto-Verification system</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Helpful tips for creating a strong passcode */}
        <div className="p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-xl">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-accent-primary mb-1">💡 Tips for a Strong Passcode:</p>
              <ul className="text-xs text-foreground-tertiary space-y-1">
                <li>• Think of a memorable date that's not your birthday</li>
                <li>• Use the last 6 digits of a phone number you remember</li>
                <li>• Create a pattern on the number pad that's easy for you to remember</li>
                <li>• Avoid using the same digit more than twice</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Development debug panel - only shows in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg text-left">
          <h4 className="text-sm font-bold text-purple-400 mb-2">🔧 Passcode Debug Info</h4>
          <div className="text-xs text-purple-300 space-y-1">
            <p>Current Passcode: <code>{passcode || 'None entered'}</code></p>
            <p>Length: <code>{passcode.length}/6</code></p>
            <p>Valid Length: <code>{passcode.length === 6 ? 'Yes' : 'No'}</code></p>
            <p>Loading State: <code>{loading ? 'Yes' : 'No'}</code></p>
            <p>AVV Checking: <code>{avvChecking ? 'Yes' : 'No'}</code></p>
            <p className="text-yellow-400 mt-2">💡 Try different passcodes to see AVV validation in action!</p>
          </div>
        </div>
      )}
    </div>
  )
}