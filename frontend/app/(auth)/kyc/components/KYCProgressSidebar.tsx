// app/(auth)/kyc/components/KYCProgressSidebar.tsx
'use client'

import { CheckCircle } from 'lucide-react'

interface KYCProgressSidebarProps {
  currentStep: number
  completedSteps: number[]
}

const steps = [
  {
    number: 1,
    title: 'Personal Information',
    description: 'Basic details and address'
  },
  {
    number: 2,
    title: 'Verify Your Identity',
    description: 'Upload government ID'
  },
  {
    number: 3,
    title: 'Photo Selfie with ID',
    description: 'Take a selfie with your ID'
  }
]

export default function KYCProgressSidebar({ currentStep, completedSteps }: KYCProgressSidebarProps) {
  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return 'completed'
    if (currentStep === stepNumber) return 'current'
    return 'pending'
  }

  return (
    <div className="bg-background-secondary rounded-2xl p-4 sm:p-6 border border-border-primary sticky top-6">
      <h3 className="font-semibold text-foreground-primary mb-4 sm:mb-6 text-base sm:text-lg">
        Verification Steps
      </h3>
      
      <div className="space-y-4 sm:space-y-6">
        {steps.map((step, index) => {
          const status = getStepStatus(step.number)
          
          return (
            <div key={step.number} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                status === 'completed' ? 'bg-status-success text-white' :
                status === 'current' ? 'bg-accent-primary text-white' :
                'bg-background-tertiary text-foreground-tertiary'
              }`}>
                {status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.number
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm sm:text-base leading-tight ${
                  status === 'current' ? 'text-accent-primary' : 'text-foreground-primary'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs sm:text-sm text-foreground-secondary mt-1 leading-tight">
                  {step.description}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 pt-4 border-t border-border-primary">
        <div className="flex items-center justify-between text-xs sm:text-sm text-foreground-secondary mb-2">
          <span>Progress</span>
          <span>{Math.round((completedSteps.length / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-background-tertiary rounded-full h-2">
          <div 
            className="bg-accent-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}