'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressStepper } from '@/components/ui/progress-stepper'
import { 
  Upload, 
  FileText, 
  Camera, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  User,
  CreditCard,
  MapPin
} from 'lucide-react'

// KYC form validation schema
const kycSchema = z.object({
  // Identity information
  fullName: z.string().min(2, 'Full name is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  occupation: z.string().min(1, 'Occupation is required'),
  
  // Address information
  streetAddress: z.string().min(5, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  
  // Identity documents
  documentType: z.enum(['passport', 'drivers_license', 'national_id']),
  documentNumber: z.string().min(5, 'Document number is required'),
  
  // Optional fields
  middleName: z.string().optional(),
  placeOfBirth: z.string().optional(),
})

type KycFormData = z.infer<typeof kycSchema>

export function ProfileCompletion() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<{
    frontId?: File
    backId?: File
    selfie?: File
  }>({})

  // Steps for progress indicator
  const steps = [
    { id: 'account', name: 'Account', status: 'completed' as const },
    { id: 'security', name: 'Security', status: 'completed' as const },
    { id: 'kyc', name: 'Identity', status: 'current' as const }
  ]

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
    mode: 'onChange'
  })

  const documentType = watch('documentType')

  // Handle file upload for documents
  const handleFileUpload = (type: 'frontId' | 'backId' | 'selfie', file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    setUploadedFiles(prev => ({ ...prev, [type]: file }))
    setError(null)
  }

  // Submit KYC information
  const onSubmit = async (data: KycFormData) => {
    // Check required documents are uploaded
    if (!uploadedFiles.frontId || !uploadedFiles.selfie) {
      setError('Please upload required documents')
      return
    }

    if (documentType === 'drivers_license' && !uploadedFiles.backId) {
      setError('Please upload both sides of your driver\'s license')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create form data for file upload
      const formData = new FormData()
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })
      
      // Add files
      if (uploadedFiles.frontId) formData.append('frontId', uploadedFiles.frontId)
      if (uploadedFiles.backId) formData.append('backId', uploadedFiles.backId)
      if (uploadedFiles.selfie) formData.append('selfie', uploadedFiles.selfie)

      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        // KYC submitted successfully - redirect to dashboard
        router.push('/dashboard?welcome=true')
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to submit KYC information')
      }
    } catch (err) {
      setError('Submission failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Skip KYC for now (users can complete later)
  const handleSkip = () => {
    router.push('/dashboard?kyc=pending')
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <ProgressStepper
        steps={steps}
        currentStep="kyc"
        orientation="horizontal"
      />

      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-accent-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground-primary mb-2">
          Complete Your Identity Verification
        </h2>
        <p className="text-foreground-secondary max-w-2xl mx-auto">
          To comply with regulations and ensure the security of our platform, 
          we need to verify your identity. This is a one-time process.
        </p>
      </div>

      {/* KYC Benefits */}
      <Card className="border-accent-primary/20 bg-accent-primary/5">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground-primary mb-3 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-accent-primary" />
            Why verify your identity?
          </h3>
          <ul className="space-y-2 text-sm text-foreground-tertiary">
            <li>• Access to all OneStep features and premium services</li>
            <li>• Higher transaction limits and enhanced security</li>
            <li>• Compliance with financial regulations (KYC/AML)</li>
            <li>• Priority customer support and account recovery</li>
          </ul>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="FULL LEGAL NAME"
                placeholder="As shown on your ID document"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <Input
                label="MIDDLE NAME (OPTIONAL)"
                placeholder="Middle name"
                {...register('middleName')}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="NATIONALITY"
                placeholder="Your nationality"
                error={errors.nationality?.message}
                {...register('nationality')}
              />
              <Input
                label="OCCUPATION"
                placeholder="Your current occupation"
                error={errors.occupation?.message}
                {...register('occupation')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="STREET ADDRESS"
              placeholder="Your full street address"
              error={errors.streetAddress?.message}
              {...register('streetAddress')}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="CITY"
                placeholder="City"
                error={errors.city?.message}
                {...register('city')}
              />
              <Input
                label="STATE/PROVINCE"
                placeholder="State or Province"
                error={errors.state?.message}
                {...register('state')}
              />
              <Input
                label="POSTAL CODE"
                placeholder="Postal/ZIP code"
                error={errors.postalCode?.message}
                {...register('postalCode')}
              />
            </div>
            
            <Input
              label="COUNTRY"
              placeholder="Country"
              error={errors.country?.message}
              {...register('country')}
            />
          </CardContent>
        </Card>

        {/* Identity Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Identity Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Type Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground-primary mb-3">
                DOCUMENT TYPE
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'passport', label: 'Passport', icon: FileText },
                  { value: 'drivers_license', label: 'Driver\'s License', icon: CreditCard },
                  { value: 'national_id', label: 'National ID', icon: CreditCard }
                ].map(({ value, label, icon: Icon }) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      value={value}
                      {...register('documentType')}
                      className="sr-only"
                    />
                    <div className={`
                      flex flex-col items-center p-4 border-2 rounded-lg transition-all
                      ${documentType === value 
                        ? 'border-accent-primary bg-accent-primary/5' 
                        : 'border-border-primary hover:border-accent-primary/50'
                      }
                    `}>
                      <Icon className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Document Number */}
            <Input
              label="DOCUMENT NUMBER"
              placeholder="Enter your document number"
              error={errors.documentNumber?.message}
              {...register('documentNumber')}
            />

            {/* File Uploads */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground-primary">Upload Documents</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Front of ID */}
                <div>
                  <label className="block text-sm font-medium text-foreground-primary mb-2">
                    Front of {documentType === 'passport' ? 'Passport' : 'ID'} *
                  </label>
                  <div className="border-2 border-dashed border-border-primary rounded-lg p-6 text-center hover:border-accent-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('frontId', e.target.files[0])}
                      className="hidden"
                      id="front-id"
                    />
                    <label htmlFor="front-id" className="cursor-pointer">
                      {uploadedFiles.frontId ? (
                        <div className="space-y-2">
                          <CheckCircle className="w-8 h-8 text-status-success mx-auto" />
                          <p className="text-sm text-status-success">Uploaded successfully</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-foreground-tertiary mx-auto" />
                          <p className="text-sm text-foreground-tertiary">Click to upload</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Back of ID (for driver's license) */}
                {documentType === 'drivers_license' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground-primary mb-2">
                      Back of Driver's License *
                    </label>
                    <div className="border-2 border-dashed border-border-primary rounded-lg p-6 text-center hover:border-accent-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('backId', e.target.files[0])}
                        className="hidden"
                        id="back-id"
                      />
                      <label htmlFor="back-id" className="cursor-pointer">
                        {uploadedFiles.backId ? (
                          <div className="space-y-2">
                            <CheckCircle className="w-8 h-8 text-status-success mx-auto" />
                            <p className="text-sm text-status-success">Uploaded successfully</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 text-foreground-tertiary mx-auto" />
                            <p className="text-sm text-foreground-tertiary">Click to upload</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* Selfie */}
                <div className={documentType === 'drivers_license' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-foreground-primary mb-2">
                    Selfie Photo *
                  </label>
                  <div className="border-2 border-dashed border-border-primary rounded-lg p-6 text-center hover:border-accent-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('selfie', e.target.files[0])}
                      className="hidden"
                      id="selfie"
                    />
                    <label htmlFor="selfie" className="cursor-pointer">
                      {uploadedFiles.selfie ? (
                        <div className="space-y-2">
                          <CheckCircle className="w-8 h-8 text-status-success mx-auto" />
                          <p className="text-sm text-status-success">Uploaded successfully</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="w-8 h-8 text-foreground-tertiary mx-auto" />
                          <p className="text-sm text-foreground-tertiary">Upload a clear selfie</p>
                        </div>
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-foreground-tertiary mt-1">
                    Take a clear photo of yourself. Make sure your face is clearly visible.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-status-info/10 border border-status-info/20 rounded-lg">
                <p className="text-status-info text-xs">
                  💡 All images should be clear, well-lit, and show all information clearly. 
                  Maximum file size: 5MB per image.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error display */}
        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-status-error mt-0.5" />
              <p className="text-status-error text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Submit buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSkip}
            disabled={loading}
            className="flex-1"
          >
            Complete Later
          </Button>
          
          <Button
            type="submit"
            disabled={!isValid || loading}
            loading={loading}
            className="flex-1"
          >
            Submit for Verification
          </Button>
        </div>

        {/* Legal notice */}
        <div className="p-4 bg-background-tertiary/50 rounded-xl border border-border-primary">
          <p className="text-xs text-foreground-tertiary leading-relaxed">
            By submitting this information, you consent to OneStep Authentication processing 
            your personal data for identity verification purposes in accordance with applicable 
            laws and regulations. Your information will be handled securely and in compliance 
            with our Privacy Policy.
          </p>
        </div>
      </form>
    </div>
  )
}