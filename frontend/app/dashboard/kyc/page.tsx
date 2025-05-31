"use client";
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText,
  CheckCircle, 
  Clock, 
  AlertTriangle,
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
  const router = useRouter()
  const [kycStatus, setKycStatus] = useState<KycStatus>({ status: 'NOT_STARTED' })
  const [loading, setLoading] = useState(true)
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
        
        <div className="flex space-x-4">
          <Button onClick={() => router.push('/kyc')} className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Start KYC Process</span>
            </Button>
        </div>
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
          </div>
        )}
      </div>

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