import { cn } from '@/lib/utils/helpers'

interface LoadingSpinnerProps {
  // Size of the spinner
  size?: 'sm' | 'md' | 'lg'
  // Custom className
  className?: string
  // Loading text
  text?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      <svg
        className={cn(
          "animate-spin text-accent-primary",
          sizeClasses[size]
        )}
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
      
      {text && (
        <p className="text-sm text-foreground-secondary animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}