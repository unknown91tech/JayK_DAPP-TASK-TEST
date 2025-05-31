"use client";

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  FileText,
  Upload,
  User
} from 'lucide-react'

// KYC status types
type KycStatusType = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

interface KycStatusData {
  status: KycStatusType
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
  documentsRequired?: string[]
}

export function KycStatus() {
  const [kycData, setKycData] = useState<KycStatusData>({
    status: 'APPROVED', // Mock data - in real app this would come from API
    submittedAt: '2024-01-15T10:00:00Z',
    reviewedAt: '2024-01-16T14:30:00Z'
  })
  const [loading, setLoading] = useState(false)

  // Get status configuration for display
  const getStatusConfig = (status: KycStatusType) => {
    const configs = {
      PENDING: {
        icon: Clock,
        color: 'text-status-warning',
        bgColor: 'bg-status-warning/10',
        borderColor: 'border-status-warning/20',
        badge: 'warning' as const,
        title: 'Verification Pending',
        description: 'We haven\'t received your verification documents yet.'
      },
      IN_PROGRESS: {
        icon: Shield,
        color: 'text-accent-primary',
        bgColor: 'bg-accent-primary/10',
        borderColor: 'border-accent-primary/20',
        badge: 'secondary' as const,
        title: 'Under Review',
        description: 'Your documents are being reviewed. This usually takes 1-3 business days.'
      },
      APPROVED: {
        icon: CheckCircle,
        color: 'text-status-success',
        bgColor: 'bg-status-success/10',
        borderColor: 'border-status-success/20',
        badge: 'success' as const,
        title: 'Identity Verified',
        description: 'Your identity has been successfully verified.'
      },
      REJECTED: {
        icon: XCircle,
        color: 'text-status-error',
        bgColor: 'bg-status-error/10',
        borderColor: 'border-status-error/20',
        badge: 'error' as const,
        title: 'Verification Failed',
        description: 'Your verification was rejected. Please review and resubmit.'
      },
      EXPIRED: {
        icon: AlertTriangle,
        color: 'text-status-warning',
        bgColor: 'bg-status-warning/10',
        borderColor: 'border-status-warning/20',
        badge: 'warning' as const,
        title: 'Verification Expired',
        description: 'Your verification has expired. Please submit new documents.'
      }
    }
    
    return configs[status]
  }

  const statusConfig = getStatusConfig(kycData.status)
  const StatusIcon = statusConfig.icon

  // Handle starting/restarting KYC process
  const handleStartKyc = () => {
    window.location.href = '/complete-profile'
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground-primary">Identity Verification</h2>
        <p className="text-foreground-secondary">
          KYC (Know Your Customer) verification status and compliance information
        </p>
      </div>

      {/* Main Status Card */}
      <Card className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}>
                <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
              </div>
              <div>
                <CardTitle className="text-xl">{statusConfig.title}</CardTitle>
                <CardDescription className="mt-1">
                  {statusConfig.description}
                </CardDescription>
              </div>
            </div>
            <Badge variant={statusConfig.badge}>
              {kycData.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Status-specific content */}
          {kycData.status === 'PENDING' && (
            <div className="space-y-4">
              <p className="text-sm text-foreground-tertiary">
                Complete your identity verification to unlock all features and higher limits.
              </p>
              <Button onClick={handleStartKyc} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Start Verification
              </Button>
            </div>
          )}

          {kycData.status === 'IN_PROGRESS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-tertiary">Submitted:</span>
                <span className="font-medium">{formatDate(kycData.submittedAt!)}</span>
              </div>
              <div className="p-3 bg-background-tertiary rounded-lg">
                <p className="text-sm text-foreground-primary font-medium mb-1">
                  What happens next?
                </p>
                <ul className="text-xs text-foreground-tertiary space-y-1">
                  <li>• Our team reviews your submitted documents</li>
                  <li>• We may request additional information if needed</li>
                  <li>• You'll receive an email once review is complete</li>
                  <li>• Typical review time: 1-3 business days</li>
                </ul>
              </div>
            </div>
          )}

          {kycData.status === 'APPROVED' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-foreground-tertiary">Submitted:</span>
                  <p className="font-medium">{formatDate(kycData.submittedAt!)}</p>
                </div>
                <div>
                  <span className="text-foreground-tertiary">Approved:</span>
                  <p className="font-medium">{formatDate(kycData.reviewedAt!)}</p>
                </div>
              </div>
              
              <div className="p-3 bg-status-success/10 border border-status-success/20 rounded-lg">
                <p className="text-sm text-status-success font-medium mb-1">
                  ✓ Verification Complete
                </p>
                <p className="text-xs text-status-success/80">
                  You now have access to all OneStep features and maximum transaction limits.
                </p>
              </div>
            </div>
          )}

          {kycData.status === 'REJECTED' && (
            <div className="space-y-4">
              <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
                <p className="text-sm text-status-error font-medium mb-2">
                  Rejection Reason:
                </p>
                <p className="text-xs text-status-error/80">
                  {kycData.rejectionReason || 'Document quality issues. Please ensure all documents are clear and legible.'}
                </p>
              </div>
              
              <Button onClick={handleStartKyc} variant="destructive" className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Resubmit Documents
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits of Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Verification Benefits
          </CardTitle>
          <CardDescription>
            What you get with a verified OneStep account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: CheckCircle,
                title: 'Full Platform Access',
                description: 'Access to all OneStep features and services',
                available: kycData.status === 'APPROVED'
              },
              {
                icon: Shield,
                title: 'Enhanced Security',
                description: 'Advanced security features and monitoring',
                available: kycData.status === 'APPROVED'
              },
              {
                icon: FileText,
                title: 'Higher Limits',
                description: 'Increased transaction and usage limits',
                available: kycData.status === 'APPROVED'
              },
              {
                icon: User,
                title: 'Priority Support',
                description: 'Faster response times and dedicated support',
                available: kycData.status === 'APPROVED'
              }
            ].map(({ icon: Icon, title, description, available }) => (
              <div key={title} className={`flex items-start space-x-3 p-3 rounded-lg border ${
                available 
                  ? 'bg-status-success/10 border-status-success/20' 
                  : 'bg-background-tertiary/50 border-border-primary'
              }`}>
                <Icon className={`w-5 h-5 mt-0.5 ${
                  available ? 'text-status-success' : 'text-foreground-tertiary'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    available ? 'text-status-success' : 'text-foreground-primary'
                  }`}>
                    {title} {available && '✓'}
                  </p>
                  <p className="text-xs text-foreground-tertiary">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Compliance & Security
          </CardTitle>
          <CardDescription>
            How we protect your information and ensure compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-foreground-primary mb-2">Regulatory Compliance</h4>
                <ul className="space-y-1 text-foreground-tertiary">
                  <li>• KYC/AML compliance</li>
                  <li>• GDPR data protection</li>
                  <li>• SOC 2 Type II certified</li>
                  <li>• Financial regulations adherence</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground-primary mb-2">Data Security</h4>
                <ul className="space-y-1 text-foreground-tertiary">
                  <li>• End-to-end encryption</li>
                  <li>• Secure document storage</li>
                  <li>• Regular security audits</li>
                  <li>• Zero-knowledge architecture</li>
                </ul>
              </div>
            </div>
            
            <div className="p-3 bg-background-tertiary/50 rounded-lg border border-border-primary">
              <p className="text-xs text-foreground-tertiary leading-relaxed">
                💡 Your personal information is encrypted and stored securely. We only collect 
                what's necessary for verification and compliance purposes. You can request 
                data deletion at any time after your account is closed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}