// app/(auth)/kyc/components/PersonalInfoStep.tsx
"use client";

import { useState } from 'react'
import { Info, RefreshCw, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PersonalInfo } from '../types/kyc'
import { COUNTRIES } from '../types/kyc'

interface PersonalInfoStepProps {
  data: PersonalInfo
  onComplete: (data: PersonalInfo) => void
  submitting: boolean
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
}

export default function PersonalInfoStep({ 
  data, 
  onComplete, 
  submitting, 
  setSubmitting, 
  setError 
}: PersonalInfoStepProps) {
  const [formData, setFormData] = useState<PersonalInfo>(data)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // For step 1, we just validate and move to next step
      // The actual submission happens in step 3
      onComplete(formData)
      console.log('✅ Personal info validated, moving to step 2')

    } catch (error) {
      console.error('❌ Personal info validation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to validate personal information')
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (field: keyof PersonalInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground-primary mb-3 sm:mb-4">
          Step 1: Personal Information
        </h2>
        <div className="bg-status-warning/10 border border-status-warning/20 rounded-xl p-3 sm:p-4">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-status-warning mt-0.5 flex-shrink-0" />
            <p className="text-sm sm:text-base text-status-warning">
              Carefully fill the form below. Please ensure to input your authentic information only.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-2">
              FIRST NAME
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary placeholder-foreground-tertiary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
              placeholder="Enter your first name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-2">
              LAST NAME
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary placeholder-foreground-tertiary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
              placeholder="Enter your last name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-primary mb-2">
            MIDDLE NAME (OPTIONAL)
          </label>
          <input
            type="text"
            value={formData.middleName || ''}
            onChange={(e) => updateField('middleName', e.target.value)}
            className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary placeholder-foreground-tertiary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
            placeholder="Enter your middle name (if any)"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-2">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary placeholder-foreground-tertiary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
              placeholder="Enter your email address"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-2">
              PHONE NUMBER
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => updateField('phoneNumber', e.target.value)}
              className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary placeholder-foreground-tertiary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
              placeholder="Enter your phone number"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-primary mb-2">
            DATE OF BIRTH
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-primary mb-2">
            OCCUPATION (OPTIONAL)
          </label>
          <input
            type="text"
            value={formData.occupation || ''}
            onChange={(e) => updateField('occupation', e.target.value)}
            className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary placeholder-foreground-tertiary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
            placeholder="Enter your occupation"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="relative">
            <label className="block text-sm font-medium text-foreground-primary mb-2">
              COUNTRY OF RESIDENCE
            </label>
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-left text-foreground-primary focus:border-accent-primary focus:outline-none flex items-center justify-between text-sm sm:text-base"
            >
              <span className="truncate">{formData.countryOfResidence || 'Select country'}</span>
              <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
            </button>
            
            {showCountryDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-background-secondary border border-border-primary rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {COUNTRIES.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => {
                      updateField('countryOfResidence', country)
                      setShowCountryDropdown(false)
                    }}
                    className="w-full p-3 text-left hover:bg-background-tertiary text-foreground-primary text-sm sm:text-base"
                  >
                    {country}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-2">
              CITY OF RESIDENCE
            </label>
            <input
              type="text"
              value={formData.cityOfResidence}
              onChange={(e) => updateField('cityOfResidence', e.target.value)}
              className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary placeholder-foreground-tertiary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
              placeholder="Enter your city"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-primary mb-2">
            ADDRESS
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary placeholder-foreground-tertiary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
            placeholder="Enter your full address"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-2">
              ZIP/POSTAL CODE
            </label>
            <input
              type="text"
              value={formData.zipPostalCode}
              onChange={(e) => updateField('zipPostalCode', e.target.value)}
              className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary placeholder-foreground-tertiary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
              placeholder="Enter ZIP/postal code"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-2">
              ADDRESS #2 (OPTIONAL)
            </label>
            <input
              type="text"
              value={formData.addressOptional}
              onChange={(e) => updateField('addressOptional', e.target.value)}
              className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary placeholder-foreground-tertiary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
              placeholder="Apartment, suite, etc."
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
          <Button
            type="button"
            variant="secondary"
            disabled
            className="opacity-50 cursor-not-allowed w-full sm:w-auto"
          >
            Previous
          </Button>
          
          <Button
            type="submit"
            disabled={submitting}
            className="bg-accent-primary hover:bg-accent-hover text-white w-full sm:w-auto"
          >
            {submitting ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </form>
    </>
  )
}