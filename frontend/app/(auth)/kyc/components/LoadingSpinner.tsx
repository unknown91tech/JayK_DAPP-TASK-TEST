// app/(auth)/kyc/components/LoadingSpinner.tsx
'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background-primary">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Skeleton */}
        <div className="mb-6 sm:mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-foreground-secondary hover:text-foreground-primary transition-colors mb-4 sm:mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-background-secondary rounded w-1/2 sm:w-1/3 mb-2"></div>
            <div className="h-4 bg-background-secondary rounded w-3/4 sm:w-1/2"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Progress Sidebar Skeleton */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-background-secondary rounded-2xl p-4 sm:p-6 border border-border-primary animate-pulse">
              <div className="h-5 bg-background-tertiary rounded w-2/3 mb-4 sm:mb-6"></div>
              
              <div className="space-y-4 sm:space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-background-tertiary rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-background-tertiary rounded w-3/4"></div>
                      <div className="h-3 bg-background-tertiary rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-background-secondary rounded-2xl p-4 sm:p-6 lg:p-8 border border-border-primary animate-pulse">
              <div className="space-y-6">
                {/* Title */}
                <div className="h-6 sm:h-8 bg-background-tertiary rounded w-1/2"></div>
                
                {/* Warning Box */}
                <div className="bg-background-tertiary/50 rounded-xl p-3 sm:p-4">
                  <div className="h-4 bg-background-primary rounded w-3/4"></div>
                </div>
                
                {/* Form Fields */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {[1, 2].map(i => (
                      <div key={i}>
                        <div className="h-4 bg-background-tertiary rounded w-1/3 mb-2"></div>
                        <div className="h-12 bg-background-tertiary rounded"></div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {[1, 2].map(i => (
                      <div key={i}>
                        <div className="h-4 bg-background-tertiary rounded w-1/3 mb-2"></div>
                        <div className="h-12 bg-background-tertiary rounded"></div>
                      </div>
                    ))}
                  </div>
                  
                  {[1, 2, 3].map(i => (
                    <div key={i}>
                      <div className="h-4 bg-background-tertiary rounded w-1/4 mb-2"></div>
                      <div className="h-12 bg-background-tertiary rounded"></div>
                    </div>
                  ))}
                </div>
                
                {/* Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
                  <div className="h-10 bg-background-tertiary rounded w-20"></div>
                  <div className="h-10 bg-background-tertiary rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}