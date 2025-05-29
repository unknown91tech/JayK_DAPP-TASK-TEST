// app/(auth)/setup-account/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Calendar, Phone } from 'lucide-react'

// Form validation schema
const accountSetupSchema = z.object({
  username: z.string()
    .min(6, 'Username must be at least 6 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  dateOfBirth: z.string()
    .min(1, 'Date of birth is required'),
  phoneNumber: z.string()
    .min(10, 'Please enter a valid phone number')
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'),
  referralCode: z.string().optional(),
})

type AccountSetupForm = z.infer<typeof accountSetupSchema>

export default function SetupAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<AccountSetupForm>({
    resolver: zodResolver(accountSetupSchema),
    mode: 'onChange'
  })

  // Watch username to show validation in real-time
  const username = watch('username')

  const onSubmit = async (data: AccountSetupForm) => {
    setLoading(true)
    setError(null)

    try {
      // Create account with the provided information
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
        setError(result.message || 'Failed to create account. Please try again.')
      }
    } catch (err) {
      setError('Account setup failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Setup your Account
        </h2>
        <p className="text-foreground-secondary">
          Enter your Username, Date of Birth, and Phone Number below
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-4 py-4">
        <div className="flex items-center space-x-2">
          <div className="progress-step active">
            1
          </div>
          <span className="text-sm font-medium text-foreground-primary">Account Setup</span>
        </div>
        <div className="w-8 h-px bg-border-primary"></div>
        <div className="flex items-center space-x-2">
          <div className="progress-step inactive">
            2
          </div>
          <span className="text-sm text-foreground-tertiary">Setup Passcode</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username field */}
        <div>
          <Input
            label="USERNAME"
            placeholder="Enter Username"
            startIcon={<User className="w-4 h-4" />}
            error={errors.username?.message}
            helperText="Must be up to 6 characters and unique"
            {...register('username')}
          />
          {username && username.length >= 6 && !errors.username && (
            <p className="text-xs text-status-success mt-1">✓ Username looks good!</p>
          )}
        </div>

        {/* Date of Birth field */}
        <div>
          <Input
            label="DATE OF BIRTH"
            type="date"
            placeholder="dd/mm/yy"
            startIcon={<Calendar className="w-4 h-4" />}
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
        </div>

        {/* Phone Number field */}
        <div>
          <Input
            label="PHONE NUMBER"
            type="tel"
            placeholder="Phone Number"
            startIcon={<Phone className="w-4 h-4" />}
            error={errors.phoneNumber?.message}
            {...register('phoneNumber')}
          />
        </div>

        {/* Referral code (optional) */}
        <div className="space-y-2">
          <p className="text-sm text-foreground-secondary">
            Optionally, Input Referral & Promo Codes
          </p>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter referral code"
              {...register('referralCode')}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="sm">
              📋
            </Button>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={!isValid || loading}
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

        {/* Important note */}
        <div className="pt-4 p-4 bg-background-tertiary/50 rounded-xl border border-border-primary">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground-primary mb-1">NOTE:</p>
              <p className="text-xs text-foreground-tertiary leading-relaxed">
                Provide correct information relation to yourself. Your Phone Number and other details as they will be used for authentication, authorization, and verification before payments and other essential support services are made.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}