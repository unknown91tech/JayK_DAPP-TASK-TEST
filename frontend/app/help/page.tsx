import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Smartphone, 
  MessageSquare, 
  HelpCircle, 
  FileText,
  Settings,
  Users,
  Lock,
  ArrowRight,
  Search
} from 'lucide-react'

export default function HelpPage() {
  const helpCategories = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of OneStep authentication',
      icon: Shield,
      articles: [
        { title: 'What is OneStep Authentication?', href: '/help/what-is-onestep' },
        { title: 'Creating Your First Account', href: '/help/create-account' },
        { title: 'Setting Up Your Passcode', href: '/help/setup-passcode' },
        { title: 'Enabling Biometric Login', href: '/help/biometric-setup' }
      ]
    },
    {
      title: 'Account Management',
      description: 'Manage your profile and security settings',
      icon: Settings,
      articles: [
        { title: 'Managing Your OneStep ID', href: '/help/manage-os-id' },
        { title: 'Device Management', href: '/help/device-management' },
        { title: 'Profile Information', href: '/help/profile-settings' },
        { title: 'Account Verification (KYC)', href: '/help/kyc-verification' }
      ]
    },
    {
      title: 'Social Login',
      description: 'Using Telegram and other social platforms',
      icon: MessageSquare,
      articles: [
        { title: 'Telegram Integration', href: '/help/telegram-login' },
        { title: 'Social Login Security', href: '/help/social-security' },
        { title: 'Troubleshooting Social Login', href: '/help/social-troubleshooting' }
      ]
    },
    {
      title: 'Biometric Authentication',
      description: 'Touch ID, Face ID, and device biometrics',
      icon: Smartphone,
      articles: [
        { title: 'How Biometric Auth Works', href: '/help/biometric-how-it-works' },
        { title: 'Supported Devices', href: '/help/supported-devices' },
        { title: 'Biometric Security', href: '/help/biometric-security' },
        { title: 'Troubleshooting Biometrics', href: '/help/biometric-troubleshooting' }
      ]
    },
    {
      title: 'Security & Privacy',
      description: 'Understanding our security measures',
      icon: Lock,
      articles: [
        { title: 'How We Keep You Safe', href: '/help/security-overview' },
        { title: 'Privacy Policy Explained', href: '/help/privacy-explained' },
        { title: 'Data Protection', href: '/help/data-protection' },
        { title: 'Reporting Security Issues', href: '/help/report-security' }
      ]
    },
    {
      title: 'dApp Integration',
      description: 'Using OneStep with other applications',
      icon: Users,
      articles: [
        { title: 'Single Sign-On (SSO)', href: '/help/sso-overview' },
        { title: 'Connecting dApps', href: '/help/connect-dapps' },
        { title: 'Managing App Permissions', href: '/help/app-permissions' },
        { title: 'Developer Resources', href: '/help/developer-resources' }
      ]
    }
  ]

  const quickActions = [
    {
      title: 'Account Recovery',
      description: 'Recover your account if you\'re locked out',
      href: '/help/recovery',
      urgent: true
    },
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      href: '/help/contact',
      urgent: false
    },
    {
      title: 'Report a Bug',
      description: 'Found an issue? Let us know',
      href: '/help/report-bug',
      urgent: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <HelpCircle className="w-8 h-8 text-accent-primary" />
            <h1 className="text-4xl font-bold text-foreground-primary">
              Help Center
            </h1>
          </div>
          <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
            Everything you need to know about OneStep authentication. 
            Find answers, guides, and get support.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground-tertiary w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full pl-12 pr-4 py-4 bg-background-secondary border border-border-primary rounded-xl text-foreground-primary placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <div className={`
                card-base p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer
                ${action.urgent ? 'border-status-error bg-status-error/5' : ''}
              `}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      action.urgent ? 'text-status-error' : 'text-foreground-primary'
                    }`}>
                      {action.title}
                    </h3>
                    <p className="text-sm text-foreground-tertiary">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className={`w-5 h-5 ${
                    action.urgent ? 'text-status-error' : 'text-accent-primary'
                  }`} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {helpCategories.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.title} className="card-base p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-accent-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground-primary">
                      {category.title}
                    </h3>
                  </div>
                </div>
                
                <p className="text-sm text-foreground-tertiary mb-4">
                  {category.description}
                </p>
                
                <div className="space-y-2">
                  {category.articles.map((article) => (
                    <Link 
                      key={article.title} 
                      href={article.href}
                      className="block text-sm text-foreground-secondary hover:text-accent-primary transition-colors py-1"
                    >
                      {article.title}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 bg-background-secondary/50 rounded-2xl border border-border-primary">
          <h2 className="text-2xl font-bold text-foreground-primary mb-4">
            Still need help?
          </h2>
          <p className="text-foreground-secondary mb-6">
            Our support team is here to help you with any questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="secondary" size="lg">
              <FileText className="w-4 h-4 mr-2" />
              Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}