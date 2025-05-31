// components/ui/otp-input.tsx
"use client";

import { useRef, useEffect, useState, KeyboardEvent, ClipboardEvent } from 'react'
import { cn } from '@/lib/utils/helpers'

interface OtpInputProps {
  // Number of OTP digits (default 6 as shown in the UI)
  length?: number
  // Callback when OTP is complete
  onComplete: (otp: string) => void
  // Callback for each digit change
  onChange?: (otp: string) => void
  // Whether to show error state
  error?: boolean
  // Loading state
  loading?: boolean
  // Auto-focus the first input on mount
  autoFocus?: boolean
  className?: string
}

export function OtpInput({ 
  length = 6, 
  onComplete, 
  onChange, 
  error = false, 
  loading = false,
  autoFocus = true,
  className 
}: OtpInputProps) {
  // State to hold each digit
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
  // Refs for each input to manage focus
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus the first input when component mounts
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  // Handle input changes
  const handleChange = (index: number, value: string) => {
    // Only allow single digits
    if (value.length > 1) return
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Call onChange callback
    const otpString = newOtp.join('')
    onChange?.(otpString)

    // Auto-move to next input if current is filled
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete if all digits are filled
    if (otpString.length === length) {
      onComplete(otpString)
    }
  }

  // Handle backspace and navigation
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      // If current input is empty, move to previous input
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
      // Clear current input
      else if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
        onChange?.(newOtp.join(''))
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Move to previous input
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      // Move to next input
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle paste events - super useful for users copying OTP from messages
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain')
    
    // Only process if pasted data contains only digits
    if (!/^\d+$/.test(pastedData)) return
    
    // Take only the required number of digits
    const digits = pastedData.slice(0, length).split('')
    const newOtp = new Array(length).fill('')
    
    // Fill the OTP array with pasted digits
    digits.forEach((digit, index) => {
      if (index < length) {
        newOtp[index] = digit
      }
    })
    
    setOtp(newOtp)
    onChange?.(newOtp.join(''))
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(digit => !digit)
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()
    
    // Check if OTP is complete
    if (newOtp.join('').length === length) {
      onComplete(newOtp.join(''))
    }
  }

  // Clear all inputs (useful for error states)
  const clearOtp = () => {
    setOtp(new Array(length).fill(''))
    inputRefs.current[0]?.focus()
    onChange?.('')
  }

  return (
    <div className={cn("flex justify-center space-x-3", className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el):any => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={loading}
          className={cn(
            // Base OTP input styling matching the UI screenshots
            "w-12 h-12 text-center text-xl font-bold rounded-lg transition-all duration-200",
            "bg-background-tertiary border-2 text-foreground-primary",
            "focus:outline-none focus:scale-105",
            // Normal state
            !error && "border-border-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary focus:ring-opacity-30",
            // Error state - red border when validation fails
            error && "border-status-error focus:border-status-error focus:ring-2 focus:ring-status-error focus:ring-opacity-30",
            // Disabled state
            loading && "opacity-50 cursor-not-allowed",
            // Filled state - slightly different styling when digit is entered
            digit && "bg-background-primary border-accent-primary"
          )}
          // Accessibility attributes
          aria-label={`OTP digit ${index + 1}`}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  )
}