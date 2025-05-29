import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/helpers'

// Button variants using class-variance-authority for type-safe styling
// This approach makes it easy to create consistent button styles across the app
const buttonVariants = cva(
  // Base styles that apply to all buttons
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        // Primary button - that beautiful gold button from the UI
        primary: "bg-accent-primary hover:bg-accent-hover text-background-primary shadow-md hover:shadow-lg",
        // Secondary button - outlined style for less prominent actions
        secondary: "bg-background-tertiary hover:bg-border-secondary text-foreground-primary border border-border-primary hover:border-accent-primary",
        // Ghost button - minimal style for subtle actions
        ghost: "hover:bg-background-tertiary text-foreground-secondary hover:text-foreground-primary",
        // Destructive button - for dangerous actions like delete
        destructive: "bg-status-error hover:bg-red-600 text-white shadow-md",
        // Link style - looks like a link but behaves like a button
        link: "text-accent-primary underline-offset-4 hover:underline hover:text-accent-hover",
        // Social login button - specifically for Telegram and other social platforms
        social: "bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border border-border-primary hover:border-accent-primary w-16 h-16 rounded-xl",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-6 py-3",
        lg: "h-12 px-8 py-3 text-base",
        xl: "h-14 px-10 py-4 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // Adding a loading state because auth operations can take time
  loading?: boolean
  // Icon support for buttons with icons
  icon?: React.ReactNode
  // Support for full width buttons
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, fullWidth, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          // Full width support
          fullWidth && "w-full",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading spinner - shows when button is in loading state */}
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* Icon support - renders icon before text */}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        
        {/* Button content */}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }