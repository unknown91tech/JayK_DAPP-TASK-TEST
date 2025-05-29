'use client'

import { useState } from 'react'
import { Fingerprint, Scan, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import { LoadingSpinner } from './loading-spinner'

interface BiometricOption {
  id: 'touch_id' | 'face_id' | 'device_biometric'
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  available: boolean
}

interface BiometricSelectorProps {
  // Callback when a biometric method is selected
  onSelect: (method: BiometricOption['id']) => Promise<void>
  // Loading state
  loading?: boolean
  // Error message
  error?: string
  // Custom className
  className?: string
}

export function BiometricSelector({
  onSelect,
  loading = false,
  error,
  className
}: BiometricSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<BiometricOption['id'] | null>(null)

  // Available biometric options
  const biometricOptions: BiometricOption[] = [
    {
      id: 'touch_id',
      name: 'Touch ID',
      description: 'Use your fingerprint to authenticate',
      icon: Fingerprint,
      available: true // In real app, check if Touch ID is available
    },
    {
      id: 'face_id',
      name: 'Face ID',
      description: 'Use face recognition to authenticate',
      icon: Scan,
      available: true // In real app, check if Face ID is available
    },
    {
      id: 'device_biometric',
      name: 'Device Biometric',
      description: 'Use your device\'s built-in biometric authentication',
      icon: Smartphone,
      available: true // In real app, check WebAuthn support
    }
  ]

  const handleSelect = async (method: BiometricOption['id']) => {
    setSelectedMethod(method)
    try {
      await onSelect(method)
    } catch (err) {
      // Error handling is done by parent component
      setSelectedMethod(null)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Available options grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {biometricOptions.map((option) => {
          const Icon = option.icon
          const isSelected = selectedMethod === option.id
          const isLoading = loading && isSelected
          
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={!option.available || loading}
              className={cn(
                // Base styles
                "flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-300 text-center",
                "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2",
                // Available vs disabled
                option.available
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50",
                // Normal state
                !isSelected && option.available && 
                  "bg-background-tertiary border-border-primary hover:border-accent-primary hover:bg-background-primary",
                // Selected state
                isSelected && 
                  "bg-accent-primary/10 border-accent-primary",
                // Loading state
                isLoading && "animate-pulse"
              )}
            >
              {/* Icon */}
              <div className="mb-4">
                {isLoading ? (
                  <LoadingSpinner size="lg" />
                ) : (
                  <Icon 
                    className={cn(
                      "w-12 h-12 transition-colors",
                      isSelected 
                        ? "text-accent-primary" 
                        : "text-foreground-secondary"
                    )} 
                  />
                )}
              </div>

              {/* Text */}
              <h3 className={cn(
                "font-semibold mb-2 transition-colors",
                isSelected 
                  ? "text-accent-primary" 
                  : "text-foreground-primary"
              )}>
                {option.name}
              </h3>
              
              <p className="text-sm text-foreground-tertiary">
                {option.description}
              </p>

              {/* Status indicator */}
              {!option.available && (
                <div className="mt-3 px-2 py-1 bg-status-warning/10 border border-status-warning/20 rounded text-xs text-status-warning">
                  Not Available
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
          <p className="text-status-error text-sm text-center">{error}</p>
        </div>
      )}

      {/* Help text */}
      <div className="text-center space-y-2">
        <p className="text-sm text-foreground-tertiary">
          Choose your preferred biometric authentication method
        </p>
        <p className="text-xs text-foreground-tertiary">
          💡 You can set up multiple methods for backup access
        </p>
      </div>
    </div>
  )
}