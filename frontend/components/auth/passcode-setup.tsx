'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PasscodeInput } from '@/components/ui/passcode-input'
import { ProgressStepper } from '@/components/ui/progress-stepper'
import { Shield, AlertTriangle } from 'lucide-react'

export function PasscodeSetup() {
  const router = useRouter()
  const [passcode, setPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Steps for the progress indicator
  const steps = [
    { id: 'account', name: 'Account Setup', status: 'completed' as const },
    { id: 'passcode', name: 'Setup Passcode', status: 'current' as const },
    { id: 'biometrics', name: 'Biometrics', status: 'upcoming' as const }
  ]

  // Handle first passcode entry
  const handlePasscodeCreate = (newPasscode: string) => {
    setPasscode(newPasscode)
    setStep('confirm')
    setError(null)
  }

  // Handle passcode confirmation
  const handlePasscodeConfirm = async (confirmCode: string) => {
    if (confirmCode !== passcode) {
      setError('Passcodes do not match. Please try again.')
      setStep('create') // Go back to creation step
      setPasscode('')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // First run through AVV system to validate passcode strength
      const avvResponse = await fetch('/api/security/avv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkType: 'PASSCODE_STRENGTH',
          input: passcode
        })
      })

      const avvResult = await avvResponse.json()

      if (!avvResponse.ok || avvResult.result === 'FAIL') {
        setError(avvResult.reason || 'Passcode does not meet security requirements')
        setStep('create')
        setPasscode('')
        return
      }

      // If AVV passes, create the passcode
      const response = await fetch('/api/auth/passcode/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      })

      if (response.ok) {
        // Success! Move to next step
        router.push('/biometrics')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create passcode')
        setStep('create')
        setPasscode('')
      }
    } catch (err) {
      setError('Setup failed. Please check your connection.')
      setStep('create')
      setPasscode('')
    } finally {
      setLoading(false)
    }
  }

  // Go back to previous step
  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create')
      setPasscode('')
      setError(null)
    } else {
      router.back()
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <ProgressStepper
        steps={steps}
        currentStep="passcode"
        orientation="horizontal"
      />

      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-accent-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          {step === 'create' ? 'Create Your Passcode' : 'Confirm Your Passcode'}
        </h2>
        <p className="text-foreground-secondary max-w-md mx-auto">
          {step === 'create' 
            ? 'Choose a secure 6-digit passcode for quick access to your account'
            : 'Enter your passcode again to confirm it'
          }
        </p>
      </div>

      {/* Passcode input */}
      <div className="max-w-sm mx-auto">
        <PasscodeInput
          key={step} // Reset component when step changes
          onComplete={step === 'create' ? handlePasscodeCreate : handlePasscodeConfirm}
          error={!!error}
          loading={loading}
          clearOnError={true}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl max-w-md mx-auto">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-status-error mt-0.5 flex-shrink-0" />
            <p className="text-status-error text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Security tips */}
      <div className="max-w-md mx-auto p-4 bg-background-tertiary/50 rounded-xl border border-border-primary">
        <h3 className="text-sm font-medium text-foreground-primary mb-2 flex items-center">
          <Shield className="w-4 h-4 mr-2 text-accent-primary" />
          Security Tips
        </h3>
        <ul className="text-xs text-foreground-tertiary space-y-1">
          <li>• Use a unique combination that only you know</li>
          <li>• Avoid using your birth date or phone number</li>
          <li>• Don't use obvious patterns like 123456</li>
          <li>• Choose something you can remember easily</li>
        </ul>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-4 max-w-md mx-auto">
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={loading}
          className="flex-1"
        >
          Back
        </Button>
        
        {step === 'create' && (
          <Button
            variant="ghost"
            onClick={() => router.push('/biometrics')}
            className="flex-1"
          >
            Skip for Now
          </Button>
        )}
      </div>

      {/* Help section */}
      <div className="text-center">
        <p className="text-xs text-foreground-tertiary">
          Your passcode is encrypted and stored securely. We cannot recover it if forgotten.
        </p>
      </div>
    </div>
  )
}