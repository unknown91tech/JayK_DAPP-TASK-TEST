// app/(auth)/kyc/components/PhotoVerificationStep.tsx
'use client'

import { useState } from 'react'
import { Camera, RefreshCw, FileText, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { IdentityVerification, PersonalInfo, KYCStatus } from '../types/kyc'
import { DOCUMENT_TYPES } from '../types/kyc'

interface PhotoVerificationStepProps {
  identityData: IdentityVerification
  personalData: PersonalInfo
  onComplete: (status: KYCStatus) => void
  onPrevious: () => void
  submitting: boolean
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
}

export default function PhotoVerificationStep({ 
  identityData, 
  personalData, 
  onComplete, 
  onPrevious, 
  submitting, 
  setSubmitting, 
  setError 
}: PhotoVerificationStepProps) {
  const [selfiePhoto, setSelfiePhoto] = useState<File | undefined>()
  const [dragActive, setDragActive] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Validate required files
      if (!selfiePhoto) {
        throw new Error('Please upload a selfie photo with your ID')
      }

      if (!identityData.documentFront) {
        throw new Error('Please upload the front of your ID document')
      }

      const formData = new FormData()
      
      // Add personal information (mapping to your API structure)
      formData.append('fullName', `${personalData.firstName} ${personalData.lastName}`)
      formData.append('middleName', personalData.middleName || '')
      formData.append('nationality', personalData.countryOfResidence)
      formData.append('occupation', personalData.occupation || '')
      formData.append('streetAddress', personalData.address)
      formData.append('city', personalData.cityOfResidence)
      formData.append('state', personalData.state || '')
      formData.append('postalCode', personalData.zipPostalCode)
      formData.append('country', personalData.countryOfResidence)
      
      // Add identity verification data
      formData.append('documentType', identityData.documentType)
      formData.append('documentNumber', identityData.documentNumber)
      
      // Add files (mapping to your API structure)
      formData.append('frontId', identityData.documentFront)
      
      if (identityData.documentBack) {
        formData.append('backId', identityData.documentBack)
      }
      
      formData.append('selfie', selfiePhoto)

      console.log('🚀 Submitting KYC data to /api/kyc/submit')

      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const responseData = await response.json()

      if (response.ok && responseData.success) {
        const completedStatus: KYCStatus = {
          status: 'UNDER_REVIEW',
          submittedAt: new Date().toISOString(),
          currentStep: 3,
          completedSteps: [1, 2, 3]
        }
        onComplete(completedStatus)
        console.log('✅ KYC submission completed successfully')
      } else {
        throw new Error(responseData.error || 'Failed to submit KYC information')
      }

    } catch (error) {
      console.error('❌ KYC submission error:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit verification')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = (file: File) => {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed')
      return
    }

    setSelfiePhoto(file)
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const removeFile = () => {
    setSelfiePhoto(undefined)
  }

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground-primary mb-3 sm:mb-4">
          Step 3: Photo Selfie with ID
        </h2>
        <p className="text-sm sm:text-base text-foreground-secondary mb-4">
          Take a clear selfie while holding your ID document next to your face. This helps us verify that you are the same person shown in the ID.
        </p>
        
        <div className="bg-status-info/10 border border-status-info/20 rounded-xl p-3 sm:p-4">
          <div className="flex items-start space-x-2">
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-status-info mt-0.5 flex-shrink-0" />
            <div className="text-status-info">
              <p className="font-medium mb-1 text-sm sm:text-base">Photo Guidelines:</p>
              <ul className="text-xs sm:text-sm space-y-1">
                <li>• Hold your ID document clearly visible next to your face</li>
                <li>• Ensure good lighting and avoid shadows</li>
                <li>• Look directly at the camera</li>
                <li>• Remove glasses, hats, or anything covering your face</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground-primary mb-4">
            SELFIE WITH ID DOCUMENT
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all ${
              dragActive
                ? 'border-accent-primary bg-accent-primary/10'
                : 'border-border-primary hover:border-accent-primary/50'
            }`}
          >
            {selfiePhoto ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-status-success flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-medium text-foreground-primary text-sm sm:text-base truncate">
                      {selfiePhoto.name}
                    </div>
                    <div className="text-xs sm:text-sm text-foreground-secondary">
                      {(selfiePhoto.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-2 hover:bg-background-tertiary rounded-lg flex-shrink-0"
                >
                  <X className="w-4 h-4 text-foreground-secondary" />
                </button>
              </div>
            ) : (
              <>
                <Camera className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-foreground-tertiary mx-auto mb-3 sm:mb-4" />
                <p className="text-foreground-primary font-medium mb-2 text-sm sm:text-base">
                  Upload your selfie with ID
                </p>
                <p className="text-xs sm:text-sm text-foreground-secondary mb-3 sm:mb-4 px-2">
                  Drag and drop your photo here, or click to browse
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                  className="hidden"
                  id="selfiePhoto"
                />
                <label
                  htmlFor="selfiePhoto"
                  className="inline-block px-3 py-2 sm:px-4 sm:py-2 bg-accent-primary text-white rounded-lg cursor-pointer hover:bg-accent-hover transition-colors text-sm sm:text-base"
                >
                  Choose Photo
                </label>
              </>
            )}
          </div>
        </div>

        {/* Review Information */}
        <div className="bg-background-tertiary rounded-xl p-4 sm:p-6">
          <h4 className="font-semibold text-foreground-primary mb-4 text-sm sm:text-base">
            Review Your Information
          </h4>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-foreground-secondary">Name:</span>
              <span className="text-foreground-primary font-medium">
                {personalData.firstName} {personalData.lastName}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-foreground-secondary">Email:</span>
              <span className="text-foreground-primary font-medium break-all">
                {personalData.email}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-foreground-secondary">Country:</span>
              <span className="text-foreground-primary font-medium">
                {personalData.countryOfResidence}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-foreground-secondary">Document Type:</span>
              <span className="text-foreground-primary font-medium">
                {DOCUMENT_TYPES.find(t => t.value === identityData.documentType)?.label}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-foreground-secondary">Document Number:</span>
              <span className="text-foreground-primary font-mono font-medium">
                {identityData.documentNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Final Warning */}
        <div className="bg-status-warning/10 border border-status-warning/20 rounded-xl p-3 sm:p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-status-warning mt-0.5 flex-shrink-0" />
            <div className="text-status-warning text-xs sm:text-sm">
              <p className="font-medium mb-1">Before submitting:</p>
              <p>Please ensure all information is accurate and all photos are clear and readable. Once submitted, your application will be reviewed by our team within 1-3 business days.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={onPrevious}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>
          
          <Button
            type="submit"
            disabled={submitting || !selfiePhoto}
            className="bg-accent-primary hover:bg-accent-hover text-white w-full sm:w-auto"
          >
            {submitting ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              'Submit for Review'
            )}
          </Button>
        </div>
      </form>
    </>
  )
}