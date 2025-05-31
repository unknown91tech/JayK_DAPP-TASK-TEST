// app/(auth)/kyc/components/KYCStatusScreen.tsx
"use client";

import { ArrowLeft, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { KYCStatus } from '../types/kyc'

interface KYCStatusScreenProps {
  status: KYCStatus
  onRestart?: () => void
}

export default function KYCStatusScreen({ status, onRestart }: KYCStatusScreenProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusConfig = () => {
    switch (status.status) {
      case 'UNDER_REVIEW':
        return {
          icon: Clock,
          iconColor: 'text-status-warning',
          iconBg: 'bg-status-warning/10',
          title: 'Under Review',
          description: 'Thank you for submitting your verification documents. Our team is currently reviewing your information. This process typically takes 1-3 business days.',
          showDate: status.submittedAt,
          dateLabel: 'Submitted on'
        }
      case 'APPROVED':
        return {
          icon: CheckCircle,
          iconColor: 'text-status-success',
          iconBg: 'bg-status-success/10',
          title: 'Verification Approved',
          description: 'Congratulations! Your identity has been successfully verified. You now have full access to all OneStep features.',
          showDate: status.reviewedAt,
          dateLabel: 'Approved on'
        }
      case 'REJECTED':
        return {
          icon: AlertTriangle,
          iconColor: 'text-status-error',
          iconBg: 'bg-status-error/10',
          title: 'Verification Rejected',
          description: 'Unfortunately, we were unable to verify your identity with the provided documents. Please review the reason below and resubmit with corrected information.',
          showDate: status.reviewedAt,
          dateLabel: 'Reviewed on'
        }
      default:
        return {
          icon: Clock,
          iconColor: 'text-foreground-tertiary',
          iconBg: 'bg-background-tertiary',
          title: 'Status Unknown',
          description: 'Please contact support for assistance.',
          showDate: undefined,
          dateLabel: ''
        }
    }
  }

  const config = getStatusConfig()
  const IconComponent = config.icon

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-foreground-secondary hover:text-foreground-primary transition-colors mb-4 sm:mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground-primary">
            Verification Status
          </h1>
        </div>

        {/* Status Card */}
        <div className="bg-background-secondary rounded-2xl p-6 sm:p-8 border border-border-primary text-center">
          <div className={`w-12 h-12 sm:w-16 sm:h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
            <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 ${config.iconColor}`} />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-foreground-primary mb-3 sm:mb-4">
            {config.title}
          </h2>
          
          <p className="text-sm sm:text-base text-foreground-secondary mb-4 sm:mb-6 max-w-2xl mx-auto leading-relaxed">
            {config.description}
          </p>

          {/* Rejection Reason */}
          {status.status === 'REJECTED' && status.rejectionReason && (
            <div className="bg-status-error/10 border border-status-error/20 rounded-xl p-4 mb-4 sm:mb-6">
              <p className="text-status-error font-medium text-sm sm:text-base">
                {status.rejectionReason}
              </p>
            </div>
          )}

          {/* Date Information */}
          {config.showDate && (
            <p className="text-xs sm:text-sm text-foreground-tertiary mb-6 sm:mb-8">
              {config.dateLabel} {formatDate(config.showDate)}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            {status.status === 'REJECTED' && onRestart && (
              <Button 
                onClick={onRestart}
                className="bg-accent-primary hover:bg-accent-hover text-white w-full sm:w-auto"
              >
                Start New Verification
              </Button>
            )}
            
            <Link href="/dashboard">
              <Button 
                variant={status.status === 'REJECTED' ? 'secondary' : 'primary'}
                className="w-full sm:w-auto"
              >
                Return to Dashboard
              </Button>
            </Link>
          </div>

          {/* Additional Info for Under Review */}
          {status.status === 'UNDER_REVIEW' && (
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border-primary">
              <div className="bg-background-tertiary rounded-xl p-4">
                <h4 className="font-medium text-foreground-primary mb-2 text-sm sm:text-base">
                  What happens next?
                </h4>
                <ul className="text-xs sm:text-sm text-foreground-secondary text-left space-y-1">
                  <li>• Our verification team will review your documents within 1-3 business days</li>
                  <li>• You'll receive an email notification once the review is complete</li>
                  <li>• If approved, you'll gain full access to all OneStep features</li>
                  <li>• If additional information is needed, we'll contact you directly</li>
                </ul>
              </div>
            </div>
          )}

          {/* Additional Info for Approved */}
          {status.status === 'APPROVED' && (
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border-primary">
              <div className="bg-status-success/5 border border-status-success/20 rounded-xl p-4">
                <h4 className="font-medium text-foreground-primary mb-2 text-sm sm:text-base">
                  🎉 You're all set!
                </h4>
                <p className="text-xs sm:text-sm text-foreground-secondary">
                  Your account is now fully verified. You can access all premium features, enjoy higher transaction limits, and benefit from enhanced security protections.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs sm:text-sm text-foreground-tertiary mb-2">
            Need help with your verification?
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
            <a 
              href="mailto:support@onestep.com" 
              className="text-accent-primary hover:text-accent-hover transition-colors text-sm"
            >
              Contact Support
            </a>
            <span className="hidden sm:inline text-foreground-tertiary">•</span>
            <a 
              href="/help/kyc" 
              className="text-accent-primary hover:text-accent-hover transition-colors text-sm"
            >
              View FAQ
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}