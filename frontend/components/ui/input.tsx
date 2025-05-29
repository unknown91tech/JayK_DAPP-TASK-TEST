// components/ui/input.tsx
import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { cn } from '@/lib/utils/helpers'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Label for the input field
  label?: string
  // Error message to display
  error?: string
  // Helper text to guide users
  helperText?: string
  // Icon to show before the input
  startIcon?: React.ReactNode
  // Icon to show after the input
  endIcon?: React.ReactNode
  // Full width input
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    label, 
    error, 
    helperText, 
    startIcon, 
    endIcon, 
    fullWidth = true,
    ...props 
  }, ref) => {
    // State for password visibility toggle
    const [showPassword, setShowPassword] = useState(false)
    
    // Determine if this is a password field
    const isPasswordField = type === 'password'
    // Actual input type (changes for password visibility)
    const inputType = isPasswordField && showPassword ? 'text' : type

    return (
      <div className={cn("space-y-2", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-foreground-primary">
            {label}
          </label>
        )}
        
        {/* Input wrapper */}
        <div className="relative">
          {/* Start icon */}
          {startIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-foreground-tertiary text-sm">
                {startIcon}
              </span>
            </div>
          )}
          
          {/* Main input field */}
          <input
            type={inputType}
            className={cn(
              // Base input styles matching our dark theme
              "flex h-12 w-full rounded-xl border border-border-primary bg-background-tertiary px-4 py-3 text-sm text-foreground-primary placeholder:text-foreground-tertiary",
              // Focus styles
              "focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary",
              // Disabled styles
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Error styles
              error && "border-status-error focus:ring-status-error focus:border-status-error",
              // Padding adjustments for icons
              startIcon && "pl-10",
              (endIcon || isPasswordField) && "pr-10",
              // Transition for smooth interactions
              "transition-all duration-200",
              className
            )}
            ref={ref}
            {...props}
          />
          
          {/* Password visibility toggle */}
          {isPasswordField && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-foreground-tertiary hover:text-foreground-primary transition-colors" />
              ) : (
                <Eye className="h-4 w-4 text-foreground-tertiary hover:text-foreground-primary transition-colors" />
              )}
            </button>
          )}
          
          {/* End icon (if not password field) */}
          {endIcon && !isPasswordField && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-foreground-tertiary text-sm">
                {endIcon}
              </span>
            </div>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <p className="text-sm text-status-error animate-slide-up">
            {error}
          </p>
        )}
        
        {/* Helper text */}
        {helperText && !error && (
          <p className="text-sm text-foreground-tertiary">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }