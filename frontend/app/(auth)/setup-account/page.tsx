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

// Form validation schema - needs to match backend exactly
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
  const [success, setSuccess] = useState<string | null>(null)

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
    console.log('🚀 Starting account setup with data:', data)
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Make sure we're sending the data in the correct format
      const requestData = {
        username: data.username.trim(),
        dateOfBirth: data.dateOfBirth, // Should be in YYYY-MM-DD format from date input
        phoneNumber: data.phoneNumber.trim(),
        ...(data.referralCode && { referralCode: data.referralCode.trim() })
      }

      console.log('📦 Sending request data:', requestData)

      // Send request to backend API
      const response = await fetch('/api/auth/setup-account', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Include any session cookies automatically
        },
        credentials: 'include', // Important: include cookies for session
        body: JSON.stringify(requestData)
      })

      console.log('📡 Response status:', response.status)
      
      // Parse response regardless of status to get error details
      const result = await response.json()
      console.log('📦 Response data:', result)

      if (response.ok && result.success) {
        console.log('✅ Account setup successful!')
        setSuccess('Account created successfully! Redirecting to passcode setup...')
        
        // Small delay to show success message
        setTimeout(() => {
          router.push('/setup-passcode')
        }, 1500)
      } else {
        // Handle different types of errors
        console.log('❌ Account setup failed:', result)
        
        if (result.error) {
          setError(result.error)
        } else if (result.details && Array.isArray(result.details)) {
          // Handle Zod validation errors
          const errorMessages = result.details.map((detail: any) => detail.message).join(', ')
          setError(`Validation error: ${errorMessages}`)
        } else {
          setError('Failed to create account. Please try again.')
        }
      }
    } catch (err) {
      console.error('❌ Network or parsing error:', err)
      setError('Network error. Please check your connection and try again.')
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
          <div className="w-8 h-8 rounded-full bg-accent-primary text-background-primary flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-sm font-medium text-foreground-primary">Account Setup</span>
        </div>
        <div className="w-8 h-px bg-border-primary"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-background-tertiary text-foreground-tertiary flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm text-foreground-tertiary">Setup Passcode</span>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl animate-slide-up">
          <p className="text-status-success text-sm text-center">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username field */}
        <div>
          <Input
            label="USERNAME"
            placeholder="Enter Username"
            startIcon={<User className="w-4 h-4" />}
            error={errors.username?.message}
            helperText="Must be at least 6 characters and unique"
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
            placeholder="Select your date of birth"
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
            placeholder="Enter your phone number"
            startIcon={<Phone className="w-4 h-4" />}
            error={errors.phoneNumber?.message}
            helperText="Include country code if international"
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
              placeholder="Enter referral code (optional)"
              {...register('referralCode')}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="sm" title="Paste from clipboard">
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
            {loading ? 'Creating Account...' : 'Proceed'}
          </Button>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl animate-slide-up">
            <p className="text-status-error text-sm">{error}</p>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Important note */}
        <div className="pt-4 p-4 bg-background-tertiary/50 rounded-xl border border-border-primary">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground-primary mb-1">IMPORTANT NOTE:</p>
              <p className="text-xs text-foreground-tertiary leading-relaxed">
                Please provide accurate information about yourself. Your phone number and other details will be used for authentication, authorization, and verification before payments and other essential support services are made.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Development Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-left">
          <h4 className="text-sm font-bold text-blue-400 mb-2">🔧 Debug Info</h4>
          <div className="text-xs text-blue-300 space-y-1">
            <p>Form Valid: <code>{isValid ? 'Yes' : 'No'}</code></p>
            <p>Username: <code>{username || 'Not entered'}</code></p>
            <p>Errors: <code>{Object.keys(errors).length > 0 ? Object.keys(errors).join(', ') : 'None'}</code></p>
          </div>
        </div>
      )}
    </div>
  )
}