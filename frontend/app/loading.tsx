// app/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary flex items-center justify-center">
      {/* Main loading container */}
      <div className="text-center space-y-6">
        {/* OneStep logo with pulse animation */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground-primary tracking-wider animate-pulse">
            ONESTEP
          </h1>
          <p className="text-accent-primary text-sm uppercase tracking-widest mt-2">
            Authentication System
          </p>
        </div>

        {/* Animated loading dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-accent-primary rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Loading text */}
        <p className="text-foreground-secondary text-sm">
          Securing your digital identity...
        </p>
      </div>
    </div>
  )
}