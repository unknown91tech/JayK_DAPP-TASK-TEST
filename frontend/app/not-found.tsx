// app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center space-y-8">
        {/* Large 404 number */}
        <div className="space-y-4">
          <h1 className="text-8xl md:text-9xl font-bold text-accent-primary opacity-80">
            404
          </h1>
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground-primary">
              Page Not Found
            </h2>
            <p className="text-foreground-secondary">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>

        {/* Illustration or icon */}
        <div className="py-8">
          <div className="w-32 h-32 mx-auto bg-background-tertiary rounded-full flex items-center justify-center opacity-50">
            <svg 
              className="w-16 h-16 text-foreground-tertiary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20.5a7.962 7.962 0 01-5.207-1.821c-.39-.352-.267-.944.207-.944h10c.468 0 .596.592.207.944z" 
              />
            </svg>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button size="lg" className="group">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
            
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => window.history.back()}
              className="group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>
          </div>

          {/* Help link */}
          <div className="pt-4 border-t border-border-primary">
            <p className="text-sm text-foreground-tertiary mb-2">
              Need help finding what you're looking for?
            </p>
            <Link 
              href="/help" 
              className="text-accent-primary hover:text-accent-hover text-sm transition-colors"
            >
              Visit our Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}