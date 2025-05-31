// app/(auth)/kyc/components/ErrorMessage.tsx
'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-status-error/10 border border-status-error/20 rounded-2xl p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-status-error mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-status-error mb-1">Error</h4>
            <p className="text-status-error text-sm">{message}</p>
          </div>
        </div>
        
        {onRetry && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onRetry}
            className="text-status-error hover:text-status-error hover:bg-status-error/10 w-full sm:w-auto"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}