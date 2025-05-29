import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  Shield, 
  Smartphone, 
  MessageSquare,
  Key,
  ArrowLeft,
  CheckCircle
} from 'lucide-react'

export default function RecoveryHelpPage() {
  const recoveryMethods = [
    {
      title: 'Use Your Backup Device',
      description: 'Sign in from a device that\'s already trusted',
      icon: Smartphone,
      steps: [
        'Go to your trusted device (phone, tablet, or computer)',
        'Open OneStep and navigate to Account Settings',
        'Select "Manage Devices" and remove the problematic device',
        'Sign in on your new device and re-add it to your trusted devices'
      ]
    },
    {
      title: 'Telegram Account Recovery',
      description: 'Use your connected Telegram account',
      icon: MessageSquare,
      steps: [
        'Go to the OneStep login page',
        'Click "Use OneStep ID to Login"',
        'Select Telegram and authenticate with your Telegram account',
        'You\'ll be able to access your account and reset your security settings'
      ]
    },
    {
      title: 'Passcode Reset',
      description: 'Reset your 6-digit passcode',
      icon: Key,
      steps: [
        'On the login page, click "Can\'t remember your Passcode?"',
        'Verify your identity using your phone number or email',
        'Follow the OTP verification process',
        'Set up a new 6-digit passcode'
      ]
    }
  ]

  const preventionTips = [
    'Always keep at least 2 trusted devices registered',
    'Ensure your phone number and email are up to date',
    'Don\'t share your passcode or biometric data',
    'Regularly backup your account recovery information',
    'Keep your Telegram account secure and accessible'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back button */}
        <div className="mb-8">
          <Link href="/help" className="inline-flex items-center text-accent-primary hover:text-accent-hover transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help Center
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-status-warning/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-status-warning" />
            </div>
            <h1 className="text-4xl font-bold text-foreground-primary">
              Account Recovery
            </h1>
          </div>
          <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
            Locked out of your OneStep account? Don't worry - we'll help you get back in safely.
          </p>
        </div>

        {/* Emergency Notice */}
        <div className="bg-status-warning/10 border border-status-warning/20 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-status-warning mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground-primary mb-2">
                Important Security Notice
              </h3>
              <p className="text-sm text-foreground-tertiary leading-relaxed">
                Account recovery is a security-sensitive process. We'll verify your identity 
                through multiple methods to ensure your account remains secure. This process 
                may take some time, but it's necessary to protect your digital identity.
              </p>
            </div>
          </div>
        </div>

        {/* Recovery Methods */}
        <div className="space-y-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground-primary text-center">
            Recovery Methods
          </h2>
          
          {recoveryMethods.map((method, index) => {
            const Icon = method.icon
            return (
              <div key={method.title} className="card-base p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground-primary mb-2">
                      {index + 1}. {method.title}
                    </h3>
                    <p className="text-foreground-secondary mb-4">
                      {method.description}
                    </p>
                    
                    <div className="space-y-2">
                      {method.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-start space-x-2">
                          <div className="w-5 h-5 bg-background-tertiary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-foreground-secondary">
                              {stepIndex + 1}
                            </span>
                          </div>
                          <p className="text-sm text-foreground-tertiary">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Prevention Tips */}
        <div className="card-base p-6 mb-8">
          <h3 className="text-xl font-semibold text-foreground-primary mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-status-success mr-2" />
            Prevent Future Lockouts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {preventionTips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-accent-primary rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-foreground-tertiary">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center p-8 bg-background-secondary/50 rounded-2xl border border-border-primary">
          <h3 className="text-xl font-semibold text-foreground-primary mb-4">
            Still Can't Access Your Account?
          </h3>
          <p className="text-foreground-secondary mb-6">
            If none of the above methods work, our support team can help you recover your account manually. 
            This process requires additional identity verification for security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="secondary" size="lg">
              <Shield className="w-4 h-4 mr-2" />
              Security Center
            </Button>
          </div>
          <p className="text-xs text-foreground-tertiary mt-4">
            💡 Have your OneStep ID ready when contacting support to speed up the process
          </p>
        </div>
      </div>
    </div>
  )
}