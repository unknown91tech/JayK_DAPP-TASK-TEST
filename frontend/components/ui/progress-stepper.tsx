'use client'

import { cn } from '@/lib/utils/helpers'
import { Check } from 'lucide-react'

interface Step {
  id: string
  name: string
  description?: string
  status: 'completed' | 'current' | 'upcoming'
}

interface ProgressStepperProps {
  // Array of steps
  steps: Step[]
  // Current step ID
  currentStep: string
  // Orientation
  orientation?: 'horizontal' | 'vertical'
  // Custom className
  className?: string
  // Whether to show descriptions
  showDescriptions?: boolean
}

export function ProgressStepper({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
  showDescriptions = true
}: ProgressStepperProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  // Update step statuses based on current step
  const updatedSteps = steps.map((step, index) => ({
    ...step,
    status: index < currentStepIndex 
      ? 'completed' 
      : index === currentStepIndex 
        ? 'current' 
        : 'upcoming'
  })) as Step[]

  if (orientation === 'vertical') {
    return (
      <nav className={cn("space-y-4", className)}>
        {updatedSteps.map((step, stepIndex) => (
          <div key={step.id} className="flex">
            {/* Step indicator */}
            <div className="flex flex-col items-center mr-4">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-300",
                  step.status === 'completed' && 
                    "bg-status-success border-status-success text-white",
                  step.status === 'current' && 
                    "bg-accent-primary border-accent-primary text-background-primary",
                  step.status === 'upcoming' && 
                    "bg-background-tertiary border-border-primary text-foreground-tertiary"
                )}
              >
                {step.status === 'completed' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  stepIndex + 1
                )}
              </div>
              
              {/* Connector line */}
              {stepIndex < steps.length - 1 && (
                <div 
                  className={cn(
                    "w-px h-8 mt-2 transition-colors",
                    stepIndex < currentStepIndex 
                      ? "bg-status-success" 
                      : "bg-border-primary"
                  )}
                />
              )}
            </div>

            {/* Step content */}
            <div className="min-w-0 flex-1 pb-8">
              <h3 
                className={cn(
                  "text-sm font-medium transition-colors",
                  step.status === 'current' 
                    ? "text-accent-primary" 
                    : step.status === 'completed'
                      ? "text-status-success"
                      : "text-foreground-tertiary"
                )}
              >
                {step.name}
              </h3>
              
              {showDescriptions && step.description && (
                <p className="text-xs text-foreground-tertiary mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </nav>
    )
  }

  // Horizontal layout
  return (
    <nav className={className}>
      <ol className="flex items-center justify-center space-x-4">
        {updatedSteps.map((step, stepIndex) => (
          <li key={step.id} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-300",
                  step.status === 'completed' && 
                    "bg-status-success border-status-success text-white",
                  step.status === 'current' && 
                    "bg-accent-primary border-accent-primary text-background-primary",
                  step.status === 'upcoming' && 
                    "bg-background-tertiary border-border-primary text-foreground-tertiary"
                )}
              >
                {step.status === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepIndex + 1
                )}
              </div>
              
              {/* Step name */}
              <span 
                className={cn(
                  "text-xs font-medium mt-2 transition-colors text-center",
                  step.status === 'current' 
                    ? "text-accent-primary" 
                    : step.status === 'completed'
                      ? "text-status-success"
                      : "text-foreground-tertiary"
                )}
              >
                {step.name}
              </span>
              
              {/* Step description */}
              {showDescriptions && step.description && (
                <span className="text-xs text-foreground-tertiary mt-1 text-center max-w-20">
                  {step.description}
                </span>
              )}
            </div>

            {/* Connector line */}
            {stepIndex < steps.length - 1 && (
              <div 
                className={cn(
                  "w-8 h-px mx-4 transition-colors",
                  stepIndex < currentStepIndex 
                    ? "bg-status-success" 
                    : "bg-border-primary"
                )}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}