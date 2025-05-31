"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProgressStepper } from '@/components/ui/progress-stepper'
import { User, Calendar, Phone, Gift } from 'lucide-react'

// Form validation schema
const accountSetupSchema = z.object({
  username: z.string()
    .min(6, 'Username must be at least 6 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  dateOfBirth: z.string()
    .min(1, 'Date of birth is required'),
  phoneNumber: z.string()
    .min(10, 'Please enter a valid phone number')
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'),
  referralCode: z.string().optional(),
})

type AccountSetupForm = z.infer<typeof accountSetupSchema>

export function AccountSetup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  // Steps for progress indicator
  const steps = [
    { id: 'account', name: 'Account Setup', status: 'current' as const },
    { id: 'passcode', name: 'Setup Passcode', status: 'upcoming' as const },
    { id: 'biometrics', name: 'Biometrics', status: 'upcoming' as const }
  ]

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    trigger
  } = useForm<AccountSetupForm>({
    resolver: zodResolver(accountSetupSchema),
    mode: 'onChange'
  })

  // Watch username for availability checking
  const username = watch('username')

  // Check username availability as user types
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 6) {
      setUsernameAvailable(null)
      return
    }

    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })

      const data = await response.json()
      setUsernameAvailable(data.available)
    } catch (err) {
      setUsernameAvailable(null)
    }
  }

  // Debounced username checking
  useState(() => {
    const timer = setTimeout(() => {
      if (username) {
        checkUsernameAvailability(username)
      }
    }, 500)

    return () => clearTimeout(timer)
  })

  // Handle form submission
  const onSubmit = async (data: AccountSetupForm) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/setup-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        // Account created successfully, move to passcode setup
        router.push('/setup-passcode')
      } else {
        setError(result.error || 'Failed to create account. Please try again.')
      }
    } catch (err) {
      setError('Account setup failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <ProgressStepper
        steps={steps}
        currentStep="account"
        orientation="horizontal"
      />

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Complete Your Profile
        </h2>
        <p className="text-foreground-secondary">
          We need a few details to set up your OneStep account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username field */}
        <div>
          <Input
            label="USERNAME"
            placeholder="Enter a unique username"
            startIcon={<User className="w-4 h-4" />}
            error={errors.username?.message}
            {...register('username')}
          />
          {username && username.length >= 6 && (
            <div className="mt-1">
              {usernameAvailable === true && (
                <p className="text-xs text-status-success">✓ Username is available!</p>
              )}
              {usernameAvailable === false && (
                <p className="text-xs text-status-error">✗ Username is already taken</p>
              )}
            </div>
          )}
          <p className="text-xs text-foreground-tertiary mt-1">
            Must be 6-20 characters. Letters, numbers, and underscores only.
          </p>
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="FIRST NAME"
            placeholder="First name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="LAST NAME"
            placeholder="Last name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        {/* Date of Birth */}
        <Input
          label="DATE OF BIRTH"
          type="date"
          startIcon={<Calendar className="w-4 h-4" />}
          error={errors.dateOfBirth?.message}
          {...register('dateOfBirth')}
        />

        {/* Phone Number */}
        <Input
          label="PHONE NUMBER"
          type="tel"
          placeholder="+1 (555) 123-4567"
          startIcon={<Phone className="w-4 h-4" />}
          error={errors.phoneNumber?.message}
          helperText="This will be used for account recovery and security"
          {...register('phoneNumber')}
        />

        {/* Referral code (optional) */}
        <div>
          <Input
            label="REFERRAL CODE (OPTIONAL)"
            placeholder="Enter referral code"
            startIcon={<Gift className="w-4 h-4" />}
            {...register('referralCode')}
          />
          <p className="text-xs text-foreground-tertiary mt-1">
            Have a friend's referral code? Enter it here for bonuses!
          </p>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full"
          disabled={!isValid || loading || usernameAvailable === false}
          loading={loading}
        >
          Continue to Passcode Setup
        </Button>

        {/* Error display */}
        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
            <p className="text-status-error text-sm">{error}</p>
          </div>
        )}
      </form>

      {/* Important note */}
      <div className="p-4 bg-background-tertiary/50 rounded-xl border border-border-primary">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs text-background-primary font-bold">!</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground-primary mb-1">Important</p>
            <p className="text-xs text-foreground-tertiary leading-relaxed">
              Please provide accurate information. Your phone number and other details will be used 
              for authentication, verification, and essential support services. This information 
              cannot be easily changed later.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}