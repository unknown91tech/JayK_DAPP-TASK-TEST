"use client";

import { ReactNode } from 'react'
import { ArrowLeft, X, HelpCircle } from 'lucide-react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  showBackButton?: boolean
  showCloseButton?: boolean
  showHelpButton?: boolean
  backUrl?: string
}

export function AuthLayout({
  children,
  title = "ONESTEP",
  subtitle,
  showBackButton = true,
  showCloseButton = true,
  showHelpButton = false,
  backUrl = "/login"
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      {/* Main container - centered like in the UI designs */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md relative">
          
          {/* Header with navigation and branding */}
          <div className="flex items-center justify-between mb-8">
            {/* Left side - back button */}
            <div className="flex items-center">
              {showBackButton && (
                <Link 
                  href={backUrl}
                  className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
                </Link>
              )}
            </div>
            
            {/* Center - OneStep branding */}
            <div className="flex-1 text-center">
              <Link href="/" className="inline-block">
                <h1 className="text-2xl font-bold text-foreground-primary tracking-wider hover:text-accent-primary transition-colors">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-accent-primary uppercase tracking-widest mt-1">
                    {subtitle}
                  </p>
                )}
              </Link>
            </div>
            
            {/* Right side - action buttons */}
            <div className="flex items-center space-x-1">
              {showHelpButton && (
                <Link 
                  href="/help"
                  className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                  aria-label="Get help"
                >
                  <HelpCircle className="w-5 h-5 text-foreground-secondary" />
                </Link>
              )}
              
              {showCloseButton && (
                <Link 
                  href="/"
                  className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-foreground-secondary" />
                </Link>
              )}
            </div>
          </div>

          {/* Main content area with glassmorphism effect */}
          <div className="bg-background-secondary/80 backdrop-blur-lg border border-border-primary rounded-3xl p-8 shadow-2xl">
            {children}
          </div>

          {/* Footer with legal links */}
          <div className="mt-6 text-center text-sm text-foreground-tertiary">
            <p>
              By continuing, you agree to our{' '}
              <Link 
                href="/terms" 
                className="text-accent-primary hover:text-accent-hover underline underline-offset-2 transition-colors"
              >
                Terms of Service
              </Link>
              {' & '}
              <Link 
                href="/privacy" 
                className="text-accent-primary hover:text-accent-hover underline underline-offset-2 transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}