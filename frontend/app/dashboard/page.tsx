// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Smartphone, 
  Users, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Copy,
  LogOut
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Mock user data - in production this would come from your auth context/API
const mockUser = {
  osId: 'OS-2024-ABC123DEF',
  username: 'user_crypto',
  firstName: 'User',
  lastName: 'OneStep',
  email: 'user@example.com',
  phoneNumber: '+1234567890',  
  isVerified: true,
  kycStatus: 'APPROVED',
  lastLoginAt: new Date(),
  deviceCount: 2,
  maxDevices: 5
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(mockUser)
  const [copied, setCopied] = useState(false)
  const [loginTime, setLoginTime] = useState<Date | null>(null)

  // Set login time when component mounts
  useEffect(() => {
    setLoginTime(new Date())
  }, [])

  // Copy OS-ID to clipboard
  const copyOsId = async () => {
    try {
      await navigator.clipboard.writeText(user.osId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy OS-ID:', err)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear session cookie
      document.cookie = 'onestep-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      // Clear any localStorage items
      localStorage.removeItem('telegram_login_temp')
      localStorage.removeItem('telegram_signup_temp')
      
      // Redirect to login
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      {/* Header */}
      <header className="bg-background-secondary/80 backdrop-blur-lg border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-background-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground-primary tracking-wider">
              ONESTEP
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent-primary text-background-primary rounded-full flex items-center justify-center text-sm font-bold">
                {user.firstName.charAt(0)}
              </div>
              <span className="text-sm font-medium text-foreground-primary">
                {user.firstName}
              </span>
            </div>
            
            {/* Logout button */}
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleLogout}
              className="text-status-error hover:text-status-error"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome section */}
        <div className="bg-background-secondary/50 backdrop-blur-lg border border-border-primary rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground-primary mb-2">
                Welcome back, {user.firstName}! 👋
              </h2>
              <p className="text-foreground-secondary">
                Your OneStep authentication dashboard is ready. Everything looks secure.
              </p>
              {loginTime && (
                <p className="text-sm text-foreground-tertiary mt-2">
                  Logged in at {loginTime.toLocaleTimeString()}
                </p>
              )}
            </div>
            
            {/* Account status indicator */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-status-success/10 border border-status-success/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-status-success" />
              <span className="text-sm font-medium text-status-success">Verified</span>
            </div>
          </div>
        </div>

        {/* OS-ID Card - Most important for SSO */}
        <div className="bg-gradient-to-r from-accent-primary/10 to-accent-primary/5 border border-accent-primary/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground-primary">Your OneStep ID</h3>
            <Shield className="w-6 h-6 text-accent-primary" />
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-foreground-tertiary mb-2">
                Use this ID to sign into any dApp that supports OneStep authentication
              </p>
              <div className="flex items-center justify-between bg-background-tertiary rounded-lg p-3">
                <code className="text-lg font-mono text-accent-primary">
                  {user.osId}
                </code>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={copyOsId}
                  className="ml-2"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-status-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-foreground-tertiary">
              💡 Tip: Your OS-ID never changes and works across all supported platforms
            </div>
          </div>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Devices */}
          <div className="bg-background-secondary border border-border-primary rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <Smartphone className="w-8 h-8 text-accent-primary" />
              <span className="text-xs text-foreground-tertiary">
                {user.deviceCount}/{user.maxDevices}
              </span>
            </div>
            <h4 className="font-semibold text-foreground-primary">Active Devices</h4>
            <p className="text-sm text-foreground-secondary mt-1">
              Manage your trusted devices
            </p>
          </div>

          {/* Security Score */}
          <div className="bg-background-secondary border border-border-primary rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <Shield className="w-8 h-8 text-status-success" />
              <span className="text-xs text-status-success font-bold">98%</span>
            </div>
            <h4 className="font-semibold text-foreground-primary">Security Score</h4>
            <p className="text-sm text-foreground-secondary mt-1">
              Excellent security setup
            </p>
          </div>

          {/* Connected dApps */}
          <div className="bg-background-secondary border border-border-primary rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-8 h-8 text-accent-primary" />
              <span className="text-xs text-foreground-tertiary">12</span>
            </div>
            <h4 className="font-semibold text-foreground-primary">Connected dApps</h4>
            <p className="text-sm text-foreground-secondary mt-1">
              Apps using your OneStep ID
            </p>
          </div>

          {/* Last Activity */}
          <div className="bg-background-secondary border border-border-primary rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-8 h-8 text-accent-primary" />
              <Clock className="w-4 h-4 text-foreground-tertiary" />
            </div>
            <h4 className="font-semibold text-foreground-primary">Last Login</h4>
            <p className="text-sm text-foreground-secondary mt-1">
              {user.lastLoginAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-background-secondary border border-border-primary rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-foreground-primary mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {/* Activity items */}
            <div className="flex items-center space-x-3 p-3 bg-background-tertiary/50 rounded-lg">
              <div className="w-2 h-2 bg-status-success rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground-primary">
                  Successful login via Telegram
                </p>
                <p className="text-xs text-foreground-tertiary">Just now</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-background-tertiary/50 rounded-lg">
              <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground-primary">
                  Dashboard accessed
                </p>
                <p className="text-xs text-foreground-tertiary">2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-background-tertiary/50 rounded-lg">
              <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground-primary">
                  Account verified successfully
                </p>
                <p className="text-xs text-foreground-tertiary">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-background-secondary border border-border-primary rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-foreground-primary mb-4">
            Security Status
          </h3>
          <div className="space-y-3">
            {/* All good */}
            <div className="flex items-start space-x-3 p-3 bg-status-success/10 border border-status-success/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-status-success mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground-primary">
                  All security checks passed
                </p>
                <p className="text-xs text-foreground-tertiary">
                  Your account is fully secured with Telegram authentication
                </p>
              </div>
            </div>
            
            {/* Recommendation */}
            <div className="flex items-start space-x-3 p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-accent-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground-primary">
                  Consider enabling biometric authentication
                </p>
                <p className="text-xs text-foreground-tertiary">
                  Add Touch ID or Face ID for faster logins
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-background-secondary border border-border-primary rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-foreground-primary mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="secondary" className="flex flex-col items-center space-y-2 h-auto p-4">
              <Smartphone className="w-6 h-6" />
              <span className="text-sm">Manage Devices</span>
            </Button>
            
            <Button variant="secondary" className="flex flex-col items-center space-y-2 h-auto p-4">
              <Shield className="w-6 h-6" />
              <span className="text-sm">Security Settings</span>
            </Button>
            
            <Button variant="secondary" className="flex flex-col items-center space-y-2 h-auto p-4">
              <Users className="w-6 h-6" />
              <span className="text-sm">Connected Apps</span>
            </Button>
            
            <Button variant="secondary" className="flex flex-col items-center space-y-2 h-auto p-4">
              <Activity className="w-6 h-6" />
              <span className="text-sm">View Logs</span>
            </Button>
          </div>
        </div>

        {/* Success message for first-time users */}
        <div className="bg-gradient-to-r from-status-success/10 to-status-success/5 border border-status-success/20 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-status-success" />
            <div>
              <h3 className="text-lg font-semibold text-status-success">
                🎉 Welcome to OneStep!
              </h3>
              <p className="text-sm text-foreground-secondary">
                Your account is now fully set up and secured. You can use your OneStep ID to sign into any supported dApp.
              </p>
            </div>
          </div>
        </div>

        {/* Development info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">🧪 Development Info</h3>
            <div className="text-sm text-blue-300 space-y-2">
              <p><strong>Login Method:</strong> Telegram OAuth + OTP</p>
              <p><strong>User ID:</strong> {user.osId}</p>
              <p><strong>Status:</strong> Successfully authenticated</p>
              <p><strong>Flow:</strong> Login → OTP Verification → Dashboard</p>
              <p className="text-green-400">✅ Login flow completed successfully!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}