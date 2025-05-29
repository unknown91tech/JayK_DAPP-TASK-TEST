export default function LoginLoading() {
  return (
    <div className="text-center space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-background-tertiary rounded animate-pulse mx-auto w-24"></div>
        <div className="h-4 bg-background-tertiary rounded animate-pulse mx-auto w-48"></div>
      </div>

      {/* Social login button skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-background-tertiary rounded animate-pulse mx-auto w-32"></div>
        <div className="w-16 h-16 bg-background-tertiary rounded-xl animate-pulse mx-auto"></div>
        <div className="h-3 bg-background-tertiary rounded animate-pulse mx-auto w-20"></div>
      </div>

      {/* Help section skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-background-tertiary rounded animate-pulse mx-auto w-40"></div>
        <div className="h-10 bg-background-tertiary rounded-xl animate-pulse w-full"></div>
      </div>

      {/* Bottom section skeleton */}
      <div className="pt-6 border-t border-border-primary space-y-3">
        <div className="h-4 bg-background-tertiary rounded animate-pulse mx-auto w-28"></div>
        <div className="h-10 bg-background-tertiary rounded-xl animate-pulse w-full"></div>
      </div>
    </div>
  )
}