"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BiometricSelector } from '@/components/ui/biometric-selector'
import { ProgressStepper } from '@/components/ui/progress-stepper'
import { useBiometrics } from '@/hooks/use-biometrics'
import { Fingerprint, CheckCircle, AlertTriangle } from 'lucide-react'

export function BiometricSetup() {
  const router = useRouter()
  const { supported, available, register, loading, error } = useBiometrics()
  const [setupComplete, setSetupComplete] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)

  // Steps for progress indicator
  const steps = [
    { id: 'account', name: 'Account Setup', status: 'completed' as const },
    { id: 'passcode', name: 'Setup Passcode', status: 'completed' as const },
    { id: 'biometrics', name: 'Biometrics', status: 'current' as const }
  ]

  // Handle biometric registration
  const handleBiometricSetup = async (method: string) => {
    setSetupError(null)
    
    try {
      // Register biometric credential
      const success = await register({
        userId: 'current-user-id', // This would come from auth context
        username: 'current-username',
        displayName: 'User Display Name'
      })

      if (success) {
        setSetupComplete(true)
        // Move to dashboard after a brief success display
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err) {
      setSetupError(error || 'Biometric setup failed')
    }
  }

  // Skip biometric setup for now
  const handleSkip = () => {
    router.push('/dashboard')
  }

  // Go back to previous step
  const handleBack = () => {
    router.back()
  }

  // If biometrics completed successfully
  if (setupComplete) {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-status-success/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-status-success" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-foreground-primary mb-2">
            All Set!
          </h2>
          <p className="text-foreground-secondary">
            Your biometric authentication is now active
          </p>
        </div>

        <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
          <p className="text-status-success text-sm">
            ✓ Biometric authentication enabled successfully
          </p>
        </div>

        <p className="text-sm text-foreground-tertiary">
          Redirecting to your dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <ProgressStepper
        steps={steps}
        currentStep="biometrics"
        orientation="horizontal"
      />

      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Fingerprint className="w-8 h-8 text-accent-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Setup Biometric Authentication
        </h2>
        <p className="text-foreground-secondary max-w-md mx-auto">
          Add an extra layer of security with Touch ID, Face ID, or your device's biometric scanner
        </p>
      </div>

      {/* Biometric availability check */}
      {!supported && (
        <div className="p-4 bg-status-warning/10 border border-status-warning/20 rounded-xl">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-status-warning mt-0.5" />
            <div>
              <p className="text-status-warning text-sm font-medium">
                Biometric authentication not supported
              </p>
              <p className="text-status-warning text-xs mt-1">
                Your device or browser doesn't support biometric authentication
              </p>
            </div>
          </div>
        </div>
      )}

      {supported && !available && (
        <div className="p-4 bg-status-warning/10 border border-status-warning/20 rounded-xl">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-status-warning mt-0.5" />
            <div>
              <p className="text-status-warning text-sm font-medium">
                No biometric authentication available
              </p>
              <p className="text-status-warning text-xs mt-1">
                Please set up Touch ID, Face ID, or fingerprint on your device first
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Biometric selector */}
      {supported && available && (
        <BiometricSelector
          onSelect={handleBiometricSetup}
          loading={loading}
          error={setupError}
        />
      )}

      {/* Benefits section */}
      <div className="p-4 bg-background-tertiary/50 rounded-xl border border-border-primary">
        <h3 className="text-sm font-medium text-foreground-primary mb-3">
          Why use biometric authentication?
        </h3>
        <ul className="text-xs text-foreground-tertiary space-y-2">
          <li className="flex items-start space-x-2">
            <span className="text-accent-primary">•</span>
            <span>Faster login - no need to remember passcodes</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-accent-primary">•</span>
            <span>More secure - your biometric data never leaves your device</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-accent-primary">•</span>
            <span>Convenient - works even when you're offline</span>
          </li>
        </ul>
      </div>

      {/* Error display */}
      {setupError && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-status-error mt-0.5" />
            <p className="text-status-error text-sm">{setupError}</p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-4">
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={loading}
          className="flex-1"
        >
          Back
        </Button>
        
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={loading}
          className="flex-1"
        >
          Skip for Now
        </Button>
      </div>

      {/* Security note */}
      <div className="text-center">
        <p className="text-xs text-foreground-tertiary">
          You can always add biometric authentication later in your security settings
        </p>
      </div>
    </div>
  )
}