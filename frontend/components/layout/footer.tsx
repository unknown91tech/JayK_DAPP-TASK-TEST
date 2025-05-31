import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border-primary bg-background-secondary/50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground-primary tracking-wider">
              ONESTEP
            </h3>
            <p className="text-sm text-foreground-tertiary">
              Advanced multi-layered authentication for the digital age.
            </p>
            <div className="flex space-x-4">
              {/* Social links would go here */}
              <div className="text-xs text-foreground-tertiary">
                Follow us on social media
              </div>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-semibold text-foreground-primary mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="font-semibold text-foreground-primary mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  System Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="font-semibold text-foreground-primary mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="text-foreground-tertiary hover:text-accent-primary transition-colors">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-8 border-t border-border-primary">
          <div className="text-sm text-foreground-tertiary">
            © 2025 OneStep Authentication. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}