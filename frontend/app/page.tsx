// app/page.tsx
"use client";
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Fingerprint, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold text-foreground-primary tracking-wider mb-4">
              ONESTEP
            </h1>
            <p className="text-xl md:text-2xl text-accent-primary">
              Advanced Multi-Layered Authentication
            </p>
          </div>

          {/* Description */}
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-lg text-foreground-secondary leading-relaxed">
              Secure access across digital platforms with social logins, passcodes, 
              and biometric authentication through cutting-edge WebAuthn technology.
            </p>
            <p className="text-foreground-tertiary">
              Experience the future of authentication with device management, 
              KYC/AML compliance, and fraud prevention built-in.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto my-12">
            <div className="card-base text-center p-6">
              <Shield className="w-12 h-12 text-accent-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground-primary mb-2">
                Multi-Layer Security
              </h3>
              <p className="text-sm text-foreground-tertiary">
                Combined social login, passcode, and biometric authentication
              </p>
            </div>

            <div className="card-base text-center p-6">
              <Fingerprint className="w-12 h-12 text-accent-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground-primary mb-2">
                Biometric Auth
              </h3>
              <p className="text-sm text-foreground-tertiary">
                Touch ID and Face ID support via WebAuthn technology
              </p>
            </div>

            <div className="card-base text-center p-6">
              <Users className="w-12 h-12 text-accent-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground-primary mb-2">
                Single Sign-On
              </h3>
              <p className="text-sm text-foreground-tertiary">
                One account, universal access across all your dApps
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="group">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link href="/signup">
                <Button variant="secondary" size="lg">
                  Create Account
                </Button>
              </Link>
            </div>

            <p className="text-sm text-foreground-tertiary">
              Already have an account? 
              <Link href="/login" className="ml-1 text-accent-primary hover:text-accent-hover transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-primary bg-background-secondary/50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-foreground-tertiary">
              © 2024 OneStep Authentication. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/terms" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/help" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}