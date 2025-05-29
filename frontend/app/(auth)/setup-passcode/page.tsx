// app/(auth)/setup-passcode/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PasscodeInput } from '@/components/ui/passcode-input'

export default function SetupPasscodePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passcode, setPasscode] = useState('')

  const handlePasscodeComplete = async (newPasscode: string) => {
    setLoading(true)
    setError(null)

    try {
      // First, validate the passcode with AVV system
      const avvResponse = await fetch('/api/security/avv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          checkType: 'PASSCODE_STRENGTH',
          input: newPasscode
        })
      })

      const avvResult = await avvResponse.json()

      if (!avvResponse.ok || avvResult.result === 'FAIL') {
        setError(avvResult.reason || 'Passcode does not meet security requirements')
        return
      }

      // If AVV passes, create the passcode
      const response = await fetch('/api/auth/passcode/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: newPasscode })
      })

      const result = await response.json()

      if (response.ok) {
        // Passcode created successfully, move to biometrics setup
        router.push('/biometrics')
      } else {
        setError(result.message || 'Failed to create passcode. Please try again.')
      }
    } catch (err) {
      setError('Failed to create passcode. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    router.back()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Setup your Passcode
        </h2>
        <p className="text-foreground-secondary">
          You need to setup your OneStep passcode to properly keep your account completely safe and secured from the prying eyes of hackers
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
          <div className="progress-step active">
            2
          </div>
          <span className="text-sm font-medium text-foreground-primary">Transaction Request Form</span>
        </div>
      </div>

      {/* Passcode setup section */}
      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-foreground-primary mb-4">
            PASSCODE
          </label>
          <Input
            placeholder="Enter Passcode"
            type="password"
            maxLength={6}
            className="text-center text-xl tracking-widest"
            value={passcode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6)
              setPasscode(value)
              if (value.length === 6) {
                handlePasscodeComplete(value)
              }
            }}
          />
          <p className="text-xs text-foreground-tertiary mt-2">
            Your Passcode must not be related to your Date of Birth in any way
          </p>
        </div>

        {/* Alternative: Use the passcode dots interface */}
        <div className="text-center">
          <p className="text-sm text-foreground-secondary mb-4">
            Or use the secure passcode interface:
          </p>
          <PasscodeInput
            onComplete={handlePasscodeComplete}
            onChange={setPasscode}
            error={!!error}
            loading={loading}
          />
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            className="flex-1"
            disabled={loading}
          >
            Previous
          </Button>
          <Button
            variant="primary"
            onClick={() => passcode.length === 6 && handlePasscodeComplete(passcode)}
            className="flex-1"
            disabled={passcode.length !== 6 || loading}
            loading={loading}
          >
            Proceed
          </Button>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl animate-slide-up">
            <p className="text-status-error text-sm">{error}</p>
          </div>
        )}

        {/* Security note */}
        <div className="p-4 bg-background-tertiary/50 rounded-xl border border-border-primary">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground-primary mb-1">Security Requirements:</p>
              <ul className="text-xs text-foreground-tertiary space-y-1">
                <li>• Must be 6 digits long</li>
                <li>• Cannot be related to your date of birth</li>
                <li>• Should not be easily guessable (avoid 123456, 000000, etc.)</li>
                <li>• Will be verified by our Auto-Verification system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}