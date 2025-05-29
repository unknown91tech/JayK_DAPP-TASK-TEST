// components/ui/passcode-input.tsx
'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/helpers'

interface PasscodeInputProps {
  // Length of passcode (default 6 as shown in UI)
  length?: number
  // Callback when passcode is complete
  onComplete: (passcode: string) => void
  // Callback for each change
  onChange?: (passcode: string) => void
  // Error state
  error?: boolean
  // Loading state
  loading?: boolean
  // Custom className
  className?: string
  // Whether to clear on error
  clearOnError?: boolean
}

export function PasscodeInput({
  length = 6,
  onComplete,
  onChange,
  error = false,
  loading = false,
  className,
  clearOnError = true
}: PasscodeInputProps) {
  const [passcode, setPasscode] = useState<string>('')
  const [showKeypad, setShowKeypad] = useState(true)

  // Clear passcode when error occurs (if clearOnError is true)
  useEffect(() => {
    if (error && clearOnError) {
      setPasscode('')
    }
  }, [error, clearOnError])

  // Handle number input from virtual keypad
  const handleNumberInput = (num: string) => {
    if (loading || passcode.length >= length) return

    const newPasscode = passcode + num
    setPasscode(newPasscode)
    onChange?.(newPasscode)

    // Call onComplete when passcode is full
    if (newPasscode.length === length) {
      onComplete(newPasscode)
    }
  }

  // Handle backspace
  const handleBackspace = () => {
    if (loading) return
    
    const newPasscode = passcode.slice(0, -1)
    setPasscode(newPasscode)
    onChange?.(newPasscode)
  }

  // Render passcode dots - those filled circles from the UI
  const renderPasscodeDots = () => {
    const dots = []
    
    for (let i = 0; i < length; i++) {
      dots.push(
        <div
          key={i}
          className={cn(
            // Base dot styling
            "w-4 h-4 rounded-full border-2 transition-all duration-300",
            // Filled state when digit is entered
            i < passcode.length 
              ? "bg-accent-primary border-accent-primary shadow-glow scale-110" 
              : "border-border-primary",
            // Error state
            error && "border-status-error",
            // Animation when filling
            i < passcode.length && "animate-bounce-subtle"
          )}
        />
      )
    }
    
    return dots
  }

  // Virtual keypad numbers
  const keypadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'backspace']
  ]

  return (
    <div className={cn("space-y-8", className)}>
      {/* Passcode dots display */}
      <div className="flex justify-center space-x-4">
        {renderPasscodeDots()}
      </div>

      {/* Virtual keypad - mimicking mobile passcode entry */}
      {showKeypad && (
        <div className="max-w-xs mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {keypadNumbers.flat().map((key, index) => {
              if (key === '') {
                // Empty space for layout
                return <div key={index} />
              }
              
              if (key === 'backspace') {
                return (
                  <button
                    key={index}
                    onClick={handleBackspace}
                    disabled={loading || passcode.length === 0}
                    className={cn(
                      "h-16 rounded-xl flex items-center justify-center transition-all duration-200",
                      "bg-background-tertiary hover:bg-background-primary",
                      "border border-border-primary hover:border-accent-primary",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transform hover:scale-105 active:scale-95"
                    )}
                    aria-label="Delete"
                  >
                    {/* Backspace icon */}
                    <svg 
                      className="w-6 h-6 text-foreground-primary" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" 
                      />
                    </svg>
                  </button>
                )
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleNumberInput(key)}
                  disabled={loading}
                  className={cn(
                    "h-16 rounded-xl text-2xl font-semibold transition-all duration-200",
                    "bg-background-tertiary hover:bg-background-primary text-foreground-primary",
                    "border border-border-primary hover:border-accent-primary",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transform hover:scale-105 active:scale-95",
                    // Special styling for 0 key
                    key === '0' && "col-span-1"
                  )}
                  aria-label={`Digit ${key}`}
                >
                  {key}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-center">
          <p className="text-status-error text-sm animate-slide-up">
            Incorrect passcode. Please try again.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center">
          <div className="inline-flex items-center text-foreground-secondary">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying passcode...
          </div>
        </div>
      )}
    </div>
  )
}