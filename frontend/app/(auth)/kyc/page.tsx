// app/(auth)/kyc/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Components
import KYCProgressSidebar from './components/KYCProgressSidebar'
import PersonalInfoStep from './components/PersonalInfoStep'
import IdentityVerificationStep from './components/IdentityVerificationStep'
import PhotoVerificationStep from './components/PhotoVerificationStep'
import KYCStatusScreen from './components/KYCStatusScreen'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'

// Types
import type { 
  PersonalInfo, 
  IdentityVerification, 
  KYCStatus 
} from './types/kyc'

export default function KYCPage() {
  const router = useRouter()
  
  // State management
  const [currentStep, setCurrentStep] = useState(1)
  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    status: 'NOT_STARTED',
    currentStep: 1,
    completedSteps: []
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data state
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    countryOfResidence: '',
    cityOfResidence: '',
    address: '',
    zipPostalCode: '',
    addressOptional: '',
    dateOfBirth: '',
    phoneNumber: '',
    nationality: '',
    occupation: '',
    state: ''
  })

  const [identityVerification, setIdentityVerification] = useState<IdentityVerification>({
    documentType: '',
    documentNumber: '',
    issuingCountry: '',
    expirationDate: ''
  })

  // Load existing KYC data and user profile on mount
  useEffect(() => {
    loadKYCData()
  }, [])

  const loadKYCData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch user profile and existing KYC status
      const [profileResponse, kycResponse] = await Promise.all([
        fetch('/api/user/profile', { credentials: 'include' }),
        fetch('/api/kyc/status', { credentials: 'include' })
      ])

      // Load user profile data to pre-fill form
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        const profile = profileData.profile
        
        setPersonalInfo(prev => ({
          ...prev,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || ''
        }))
      }

      // Load existing KYC status if available
      if (kycResponse.ok) {
        const kycData = await kycResponse.json()
        
        // Map backend status to frontend status
        const mappedStatus = mapKYCStatus(kycData.kycStatus)
        
        setKycStatus({
          status: mappedStatus,
          submittedAt: kycData.submittedAt,
          currentStep: mappedStatus === 'NOT_STARTED' ? 1 : 3,
          completedSteps: mappedStatus === 'NOT_STARTED' ? [] : [1, 2, 3]
        })
        
        if (mappedStatus === 'NOT_STARTED') {
          setCurrentStep(1)
        }
      }

    } catch (error) {
      console.error('❌ Failed to load KYC data:', error)
      setError('Failed to load verification data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  // Map backend KYC status to frontend status
  const mapKYCStatus = (backendStatus: string) => {
    switch (backendStatus) {
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'UNDER_REVIEW'
      case 'APPROVED':
        return 'APPROVED'
      case 'REJECTED':
        return 'REJECTED'
      default:
        return 'NOT_STARTED'
    }
  }

  const handleStepComplete = (step: number, data?: any) => {
    if (data) {
      if (step === 1) {
        setPersonalInfo(prev => ({ ...prev, ...data }))
      } else if (step === 2) {
        setIdentityVerification(prev => ({ ...prev, ...data }))
      }
    }

    setKycStatus(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps.filter(s => s !== step), step],
      currentStep: step + 1
    }))
    setCurrentStep(step + 1)
  }

  const handleKYCComplete = (status: KYCStatus) => {
    setKycStatus(status)
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetKYC = () => {
    setKycStatus({ status: 'NOT_STARTED', currentStep: 1, completedSteps: [] })
    setCurrentStep(1)
    setPersonalInfo({
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      countryOfResidence: '',
      cityOfResidence: '',
      address: '',
      zipPostalCode: '',
      addressOptional: '',
      dateOfBirth: '',
      phoneNumber: '',
      nationality: '',
      occupation: '',
      state: ''
    })
    setIdentityVerification({
      documentType: '',
      documentNumber: '',
      issuingCountry: '',
      expirationDate: ''
    })
  }

  // Show loading state
  if (loading) {
    return <LoadingSpinner />
  }

  // Show completion/status screen for submitted KYC
  if (kycStatus.status === 'UNDER_REVIEW' || kycStatus.status === 'APPROVED' || kycStatus.status === 'REJECTED') {
    return (
      <KYCStatusScreen 
        status={kycStatus} 
        onRestart={resetKYC}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-foreground-secondary hover:text-foreground-primary transition-colors mb-4 sm:mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground-primary">
              Complete Your Verification
            </h1>
            <p className="text-sm sm:text-base text-foreground-secondary">
              Verify your identity to unlock full access to OneStep features and increase your security score.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <KYCProgressSidebar 
              currentStep={currentStep}
              completedSteps={kycStatus.completedSteps}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-background-secondary rounded-2xl p-4 sm:p-6 lg:p-8 border border-border-primary">
              {/* Error Message */}
              {error && (
                <ErrorMessage 
                  message={error} 
                  onRetry={loadKYCData}
                />
              )}

              {/* Step Content */}
              {currentStep === 1 && (
                <PersonalInfoStep
                  data={personalInfo}
                  onComplete={(data) => handleStepComplete(1, data)}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                  setError={setError}
                />
              )}

              {currentStep === 2 && (
                <IdentityVerificationStep
                  data={identityVerification}
                  onComplete={(data) => handleStepComplete(2, data)}
                  onPrevious={goToPreviousStep}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                  setError={setError}
                />
              )}

              {currentStep === 3 && (
                <PhotoVerificationStep
                  identityData={identityVerification}
                  personalData={personalInfo}
                  onComplete={handleKYCComplete}
                  onPrevious={goToPreviousStep}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                  setError={setError}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}