// app/(auth)/kyc/components/IdentityVerificationStep.tsx
"use client";

import { useState } from 'react'
import { Upload, RefreshCw, ChevronDown, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { IdentityVerification } from '../types/kyc'
import { COUNTRIES, DOCUMENT_TYPES } from '../types/kyc'

interface IdentityVerificationStepProps {
  data: IdentityVerification
  onComplete: (data: IdentityVerification) => void
  onPrevious: () => void
  submitting: boolean
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
}

export default function IdentityVerificationStep({ 
  data, 
  onComplete, 
  onPrevious, 
  submitting, 
  setSubmitting, 
  setError 
}: IdentityVerificationStepProps) {
  const [formData, setFormData] = useState<IdentityVerification>(data)
  const [showIssuingCountryDropdown, setShowIssuingCountryDropdown] = useState(false)
  const [dragActive, setDragActive] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // For step 2, we just validate and move to next step
      // The actual submission with files happens in step 3
      onComplete(formData)
      console.log('✅ Identity verification data validated, moving to step 3')

    } catch (error) {
      console.error('❌ Identity verification validation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to validate identity verification')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = (file: File, type: 'documentFront' | 'documentBack') => {
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

    setFormData(prev => ({
      ...prev,
      [type]: file
    }))
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault()
    setDragActive(type)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(null)
  }

  const handleDrop = (e: React.DragEvent, type: 'documentFront' | 'documentBack') => {
    e.preventDefault()
    setDragActive(null)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0], type)
    }
  }

  const removeFile = (type: 'documentFront' | 'documentBack') => {
    setFormData(prev => ({
      ...prev,
      [type]: undefined
    }))
  }

  const updateField = (field: keyof IdentityVerification, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const FileUploadArea = ({ 
    type, 
    label, 
    file 
  }: { 
    type: 'documentFront' | 'documentBack'
    label: string
    file?: File 
  }) => (
    <div>
      <label className="block text-sm font-medium text-foreground-primary mb-4">
        {label}
      </label>
      <div
        onDragOver={(e) => handleDragOver(e, type)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, type)}
        className={`border-2 border-dashed rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all ${
          dragActive === type
            ? 'border-accent-primary bg-accent-primary/10'
            : 'border-border-primary hover:border-accent-primary/50'
        }`}
      >
        {file ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-status-success flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="font-medium text-foreground-primary text-sm sm:text-base truncate">
                  {file.name}
                </div>
                <div className="text-xs sm:text-sm text-foreground-secondary">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeFile(type)}
              className="p-2 hover:bg-background-tertiary rounded-lg flex-shrink-0"
            >
              <X className="w-4 h-4 text-foreground-secondary" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-foreground-tertiary mx-auto mb-3 sm:mb-4" />
            <p className="text-foreground-primary font-medium mb-2 text-sm sm:text-base">
              Upload {label.toLowerCase()}
            </p>
            <p className="text-xs sm:text-sm text-foreground-secondary mb-3 sm:mb-4 px-2">
              Drag and drop your file here, or click to browse
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, type)
              }}
              className="hidden"
              id={type}
            />
            <label
              htmlFor={type}
              className="inline-block px-3 py-2 sm:px-4 sm:py-2 bg-accent-primary text-white rounded-lg cursor-pointer hover:bg-accent-hover transition-colors text-sm sm:text-base"
            >
              Choose File
            </label>
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground-primary mb-3 sm:mb-4">
          Step 2: Verify Your Identity
        </h2>
        <p className="text-sm sm:text-base text-foreground-secondary">
          Upload a clear photo of your government-issued ID document. Make sure all text is readable and the image is well-lit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground-primary mb-4">
            DOCUMENT TYPE
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {DOCUMENT_TYPES.map((docType) => (
              <button
                key={docType.value}
                type="button"
                onClick={() => updateField('documentType', docType.value)}
                className={`p-3 sm:p-4 border rounded-xl text-left transition-all ${
                  formData.documentType === docType.value
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-border-primary hover:border-accent-primary/50'
                }`}
              >
                <div className="font-medium text-foreground-primary mb-1 text-sm sm:text-base">
                  {docType.label}
                </div>
                <div className="text-xs sm:text-sm text-foreground-secondary">
                  {docType.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {formData.documentType && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground-primary mb-2">
                  DOCUMENT NUMBER
                </label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) => updateField('documentNumber', e.target.value)}
                  className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary placeholder-foreground-tertiary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
                  placeholder="Enter document number"
                  required
                />
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-foreground-primary mb-2">
                  ISSUING COUNTRY
                </label>
                <button
                  type="button"
                  onClick={() => setShowIssuingCountryDropdown(!showIssuingCountryDropdown)}
                  className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-left text-foreground-primary focus:border-accent-primary focus:outline-none flex items-center justify-between text-sm sm:text-base"
                >
                  <span className="truncate">{formData.issuingCountry || 'Select country'}</span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
                </button>
                
                {showIssuingCountryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-background-secondary border border-border-primary rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => {
                          updateField('issuingCountry', country)
                          setShowIssuingCountryDropdown(false)
                        }}
                        className="w-full p-3 text-left hover:bg-background-tertiary text-foreground-primary text-sm sm:text-base"
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-primary mb-2">
                EXPIRATION DATE
              </label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => updateField('expirationDate', e.target.value)}
                className="w-full p-3 bg-background-tertiary border border-border-primary rounded-lg text-foreground-primary focus:border-accent-primary focus:outline-none text-sm sm:text-base"
                required
              />
            </div>

            {/* Document Upload */}
            <div className="space-y-4 sm:space-y-6">
              <FileUploadArea 
                type="documentFront"
                label="DOCUMENT FRONT"
                file={formData.documentFront}
              />

              {(formData.documentType === 'drivers_license' || formData.documentType === 'national_id') && (
                <FileUploadArea 
                  type="documentBack"
                  label="DOCUMENT BACK"
                  file={formData.documentBack}
                />
              )}
            </div>
          </>
        )}

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
            disabled={submitting || !formData.documentType || !formData.documentFront}
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