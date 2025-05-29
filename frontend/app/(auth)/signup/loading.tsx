export default function SignupLoading() {
  return (
    <div className="text-center space-y-8">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-background-tertiary rounded animate-pulse mx-auto w-20"></div>
        <div className="h-4 bg-background-tertiary rounded animate-pulse mx-auto w-40"></div>
      </div>

      {/* Subtitle skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-background-tertiary rounded animate-pulse mx-auto w-64"></div>
        <div className="h-3 bg-background-tertiary rounded animate-pulse mx-auto w-48"></div>
      </div>

      {/* Main signup section skeleton */}
      <div className="space-y-6">
        <div className="h-4 bg-background-tertiary rounded animate-pulse mx-auto w-36"></div>
        
        {/* Telegram signup button skeleton */}
        <div className="w-20 h-20 bg-background-tertiary rounded-xl animate-pulse mx-auto"></div>

        {/* Help section skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-background-tertiary rounded animate-pulse mx-auto w-48"></div>
          <div className="h-10 bg-background-tertiary rounded-xl animate-pulse w-full"></div>
        </div>

        {/* Additional info skeleton */}
        <div className="pt-4 space-y-2">
          <div className="h-3 bg-background-tertiary rounded animate-pulse mx-auto w-56"></div>
          <div className="h-3 bg-background-tertiary rounded animate-pulse mx-auto w-44"></div>
        </div>
      </div>

      {/* Back to login skeleton */}
      <div className="pt-6 border-t border-border-primary space-y-3">
        <div className="h-4 bg-background-tertiary rounded animate-pulse mx-auto w-32"></div>
        <div className="h-8 bg-background-tertiary rounded animate-pulse mx-auto w-24"></div>
      </div>
    </div>
  )
}