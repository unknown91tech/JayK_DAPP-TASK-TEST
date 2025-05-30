// app/dashboard/kyc/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  MapPin, 
  Briefcase, 
  CreditCard,
  Camera,
  FileImage,
  X,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface KycData {
  fullName: string
  middleName: string
  nationality: string
  occupation: string
  streetAddress: string
  city: string
  state: string
  postalCode: string
  country: string
  documentType: string
  documentNumber: string
}

interface KycStatus {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  submittedAt?: string
  reviewedAt?: string
  notes?: string
}

export default function KycPage() {
  const [kycStatus, setKycStatus] = useState<KycStatus>({ status: 'NOT_STARTED' })
  const [kycData, setKycData] = useState<KycData>({
    fullName: '',
    middleName: '',
    nationality: '',
    occupation: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    documentType: 'passport',
    documentNumber: ''
  })
  const [files, setFiles] = useState<{
    frontId?: File
    backId?: File
    selfie?: File
  }>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchKycStatus()
  }, [])

  const fetchKycStatus = async () => {
    try {
      const response = await fetch('/api/kyc/status', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setKycStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch KYC status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof KycData, value: string) => {
    setKycData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (type: 'frontId' | 'backId' | 'selfie', file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setMessage({ type: 'error', text: 'File size must be less than 5MB' })
      return
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' })
      return
    }

    setFiles(prev => ({ ...prev, [type]: file }))
    setMessage(null)
  }

  const removeFile = (type: 'frontId' | 'backId' | 'selfie') => {
    setFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[type]
      return newFiles
    })
  }

  const submitKyc = async () => {
    // Validate required fields
    const requiredFields = ['fullName', 'nationality', 'occupation', 'streetAddress', 'city', 'country', 'documentNumber']
    const missingFields = requiredFields.filter(field => !kycData[field as keyof KycData])
    
    if (missingFields.length > 0) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    if (!files.frontId || !files.selfie) {
      setMessage({ type: 'error', text: 'Please upload required documents' })
      return
    }

    if (kycData.documentType === 'nationalId' && !files.backId) {
      setMessage({ type: 'error', text: 'Please upload both sides of your national ID' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const formData = new FormData()
      
      // Add KYC data
      Object.entries(kycData).forEach(([key, value]) => {
        formData.append(key, value)
      })
      
      // Add files
      if (files.frontId) formData.append('frontId', files.frontId)
      if (files.backId) formData.append('backId', files.backId)
      if (files.selfie) formData.append('selfie', files.selfie)

      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'KYC information submitted successfully!' })
        setShowForm(false)
        await fetchKycStatus() // Refresh status
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to submit KYC information' })
      }
    } catch (error) {
      console.error('Failed to submit KYC:', error)
      setMessage({ type: 'error', text: 'Failed to submit KYC information. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-status-success'
      case 'IN_PROGRESS': 
      case 'UNDER_REVIEW': return 'text-status-warning'
      case 'REJECTED': return 'text-status-error'
      default: return 'text-foreground-secondary'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-status-success/10 border-status-success/20'
      case 'IN_PROGRESS': 
      case 'UNDER_REVIEW': return 'bg-status-warning/10 border-status-warning/20'
      case 'REJECTED': return 'bg-status-error/10 border-status-error/20'
      default: return 'bg-background-tertiary border-border-primary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return CheckCircle
      case 'IN_PROGRESS': 
      case 'UNDER_REVIEW': return Clock
      case 'REJECTED': return AlertTriangle
      default: return FileText
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'Not Started'
      case 'IN_PROGRESS': return 'In Progress'
      case 'UNDER_REVIEW': return 'Under Review'
      case 'APPROVED': return 'Approved'
      case 'REJECTED': return 'Rejected'
      default: return status
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground-primary">KYC Verification</h1>
          <p className="text-foreground-secondary">Complete your identity verification to unlock all features</p>
        </div>
        
        {kycStatus.status === 'NOT_STARTED' && (
          <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Start KYC Process</span>
          </Button>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-status-success/10 border-status-success/20 text-status-success' 
            : 'bg-status-error/10 border-status-error/20 text-status-error'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* KYC Status Card */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground-primary">Verification Status</h3>
          
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg border ${getStatusBg(kycStatus.status)}`}>
            {(() => {
              const StatusIcon = getStatusIcon(kycStatus.status)
              return <StatusIcon className={`w-4 h-4 ${getStatusColor(kycStatus.status)}`} />
            })()}
            <span className={`text-sm font-medium ${getStatusColor(kycStatus.status)}`}>
              {getStatusText(kycStatus.status)}
            </span>
          </div>
        </div>

        {/* Status Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground-primary mb-1">
              {kycStatus.status === 'NOT_STARTED' ? '0' : '1'}
            </div>
            <div className="text-sm text-foreground-secondary">Submissions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground-primary mb-1">
              {formatDate(kycStatus.submittedAt)}
            </div>
            <div className="text-sm text-foreground-secondary">Submitted</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground-primary mb-1">
              {kycStatus.status === 'APPROVED' ? '✓' : kycStatus.status === 'REJECTED' ? '✗' : '⏳'}
            </div>
            <div className="text-sm text-foreground-secondary">Status</div>
          </div>
        </div>

        {/* Status Messages */}
        {kycStatus.status === 'NOT_STARTED' && (
          <div className="mt-6 p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-xl">
            <h4 className="text-sm font-medium text-foreground-primary mb-2">Get Started</h4>
            <p className="text-sm text-foreground-secondary">
              Complete your KYC verification to access premium features and higher transaction limits. 
              The process typically takes 1-3 business days.
            </p>
          </div>
        )}

        {kycStatus.status === 'UNDER_REVIEW' && (
          <div className="mt-6 p-4 bg-status-warning/5 border border-status-warning/20 rounded-xl">
            <h4 className="text-sm font-medium text-foreground-primary mb-2">Under Review</h4>
            <p className="text-sm text-foreground-secondary">
              Your documents are being reviewed by our verification team. You'll receive an update within 1-3 business days.
            </p>
          </div>
        )}

        {kycStatus.status === 'APPROVED' && (
          <div className="mt-6 p-4 bg-status-success/5 border border-status-success/20 rounded-xl">
            <h4 className="text-sm font-medium text-foreground-primary mb-2">Verification Complete</h4>
            <p className="text-sm text-foreground-secondary">
              Your identity has been successfully verified! You now have access to all OneStep features.
            </p>
          </div>
        )}

        {kycStatus.status === 'REJECTED' && (
          <div className="mt-6 p-4 bg-status-error/5 border border-status-error/20 rounded-xl">
            <h4 className="text-sm font-medium text-foreground-primary mb-2">Verification Failed</h4>
            <p className="text-sm text-foreground-secondary mb-3">
              {kycStatus.notes || 'Your submission could not be verified. Please review your information and try again.'}
            </p>
            <Button size="sm" onClick={() => setShowForm(true)}>
              Resubmit Documents
            </Button>
          </div>
        )}
      </div>

      {/* KYC Form */}
      {showForm && (
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground-primary">Identity Verification</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowForm(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-8">
            {/* Personal Information */}
            <div>
              <h4 className="text-md font-semibold text-foreground-primary mb-4">Personal Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="FULL NAME *"
                  placeholder="Enter your full legal name"
                  value={kycData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  startIcon={<User className="w-4 h-4" />}
                />
                
                <Input
                  label="MIDDLE NAME"
                  placeholder="Enter your middle name (optional)"
                  value={kycData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  startIcon={<User className="w-4 h-4" />}
                />
                
                <Input
                  label="NATIONALITY *"
                  placeholder="Enter your nationality"
                  value={kycData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  startIcon={<MapPin className="w-4 h-4" />}
                />
                
                <Input
                  label="OCCUPATION *"
                  placeholder="Enter your occupation"
                  value={kycData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  startIcon={<Briefcase className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h4 className="text-md font-semibold text-foreground-primary mb-4">Address Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="STREET ADDRESS *"
                    placeholder="Enter your street address"
                    value={kycData.streetAddress}
                    onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                    startIcon={<MapPin className="w-4 h-4" />}
                  />
                </div>
                
                <Input
                  label="CITY *"
                  placeholder="Enter your city"
                  value={kycData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  startIcon={<MapPin className="w-4 h-4" />}
                />
                
                <Input
                  label="STATE/PROVINCE"
                  placeholder="Enter your state or province"
                  value={kycData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  startIcon={<MapPin className="w-4 h-4" />}
                />
                
                <Input
                  label="POSTAL CODE"
                  placeholder="Enter your postal code"
                  value={kycData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  startIcon={<MapPin className="w-4 h-4" />}
                />
                
                <Input
                  label="COUNTRY *"
                  placeholder="Enter your country"
                  value={kycData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  startIcon={<MapPin className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Document Information */}
            <div>
              <h4 className="text-md font-semibold text-foreground-primary mb-4">Identity Document</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-2">
                    DOCUMENT TYPE *
                  </label>
                  <select
                    value={kycData.documentType}
                    onChange={(e) => handleInputChange('documentType', e.target.value)}
                    className="w-full px-4 py-3 bg-background-tertiary border border-border-primary rounded-xl text-foreground-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  >
                    <option value="passport">Passport</option>
                    <option value="nationalId">National ID</option>
                    <option value="drivingLicense">Driving License</option>
                  </select>
                </div>
                
                <Input
                  label="DOCUMENT NUMBER *"
                  placeholder="Enter your document number"
                  value={kycData.documentNumber}
                  onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                  startIcon={<CreditCard className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Document Upload */}
            <div>
              <h4 className="text-md font-semibold text-foreground-primary mb-4">Document Upload</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Front ID */}
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-2">
                    FRONT OF ID *
                  </label>
                  {files.frontId ? (
                    <div className="relative bg-background-tertiary border border-border-primary rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <FileImage className="w-8 h-8 text-accent-primary" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground-primary truncate">
                            {files.frontId.name}
                          </div>
                          <div className="text-xs text-foreground-tertiary">
                            {(files.frontId.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile('frontId')}
                          className="p-1 hover:bg-background-primary rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-foreground-secondary" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('frontId', e.target.files[0])}
                        className="hidden"
                      />
                      <div className="border-2 border-dashed border-border-primary rounded-xl p-6 text-center hover:border-accent-primary transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 text-foreground-tertiary mx-auto mb-2" />
                        <div className="text-sm font-medium text-foreground-primary">Upload Front</div>
                        <div className="text-xs text-foreground-tertiary">PNG, JPG up to 5MB</div>
                      </div>
                    </label>
                  )}
                </div>

                {/* Back ID (only for National ID) */}
                {kycData.documentType === 'nationalId' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-2">
                      BACK OF ID *
                    </label>
                    {files.backId ? (
                      <div className="relative bg-background-tertiary border border-border-primary rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                          <FileImage className="w-8 h-8 text-accent-primary" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-foreground-primary truncate">
                              {files.backId.name}
                            </div>
                            <div className="text-xs text-foreground-tertiary">
                              {(files.backId.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile('backId')}
                            className="p-1 hover:bg-background-primary rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-foreground-secondary" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('backId', e.target.files[0])}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-border-primary rounded-xl p-6 text-center hover:border-accent-primary transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 text-foreground-tertiary mx-auto mb-2" />
                          <div className="text-sm font-medium text-foreground-primary">Upload Back</div>
                          <div className="text-xs text-foreground-tertiary">PNG, JPG up to 5MB</div>
                        </div>
                      </label>
                    )}
                  </div>
                )}

                {/* Selfie */}
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-2">
                    SELFIE WITH ID *
                  </label>
                  {files.selfie ? (
                    <div className="relative bg-background-tertiary border border-border-primary rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <Camera className="w-8 h-8 text-accent-primary" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground-primary truncate">
                            {files.selfie.name}
                          </div>
                          <div className="text-xs text-foreground-tertiary">
                            {(files.selfie.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile('selfie')}
                          className="p-1 hover:bg-background-primary rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-foreground-secondary" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('selfie', e.target.files[0])}
                        className="hidden"
                      />
                      <div className="border-2 border-dashed border-border-primary rounded-xl p-6 text-center hover:border-accent-primary transition-colors cursor-pointer">
                        <Camera className="w-8 h-8 text-foreground-tertiary mx-auto mb-2" />
                        <div className="text-sm font-medium text-foreground-primary">Take Selfie</div>
                        <div className="text-xs text-foreground-tertiary">PNG, JPG up to 5MB</div>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border-primary">
              <Button
                variant="secondary"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              
              <Button
                onClick={submitKyc}
                loading={submitting}
                disabled={!kycData.fullName || !files.frontId || !files.selfie}
              >
                Submit for Review
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Requirements Info */}
      <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Eye className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-foreground-primary mb-1">Verification Requirements</h4>
            <ul className="text-sm text-foreground-secondary space-y-1">
              <li>• Clear, high-quality photos of your identity document</li>
              <li>• Document must be valid and not expired</li>
              <li>• Selfie must clearly show your face and the document</li>
              <li>• All information must match exactly</li>
              <li>• Processing typically takes 1-3 business days</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}