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
  Copy
} from 'lucide-react'

// This would normally come from your auth context or API
const mockUser = {
  osId: 'OS-2024-ABC123DEF',
  username: 'johnsmith_crypto',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@example.com',
  phoneNumber: '+1234567890',
  isVerified: true,
  kycStatus: 'APPROVED',
  lastLoginAt: new Date(),
  deviceCount: 3,
  maxDevices: 5
}

export default function DashboardPage() {
  const [user] = useState(mockUser)
  const [copied, setCopied] = useState(false)

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

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="bg-background-secondary/50 backdrop-blur-lg border border-border-primary rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground-primary mb-2">
              Welcome back, {user.firstName}! 👋
            </h1>
            <p className="text-foreground-secondary">
              Your OneStep authentication dashboard is ready. Everything looks secure.
            </p>
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
          <h2 className="text-xl font-semibold text-foreground-primary">Your OneStep ID</h2>
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
        <div className="card-base">
          <div className="flex items-center justify-between mb-3">
            <Smartphone className="w-8 h-8 text-accent-primary" />
            <span className="text-xs text-foreground-tertiary">
              {user.deviceCount}/{user.maxDevices}
            </span>
          </div>
          <h3 className="font-semibold text-foreground-primary">Active Devices</h3>
          <p className="text-sm text-foreground-secondary mt-1">
            Manage your trusted devices
          </p>
        </div>

        {/* Security Score */}
        <div className="card-base">
          <div className="flex items-center justify-between mb-3">
            <Shield className="w-8 h-8 text-status-success" />
            <span className="text-xs text-status-success font-bold">98%</span>
          </div>
          <h3 className="font-semibold text-foreground-primary">Security Score</h3>
          <p className="text-sm text-foreground-secondary mt-1">
            Excellent security setup
          </p>
        </div>

        {/* Connected dApps */}
        <div className="card-base">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-accent-primary" />
            <span className="text-xs text-foreground-tertiary">12</span>
          </div>
          <h3 className="font-semibold text-foreground-primary">Connected dApps</h3>
          <p className="text-sm text-foreground-secondary mt-1">
            Apps using your OneStep ID
          </p>
        </div>

        {/* Last Activity */}
        <div className="card-base">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-8 h-8 text-accent-primary" />
            <Clock className="w-4 h-4 text-foreground-tertiary" />
          </div>
          <h3 className="font-semibold text-foreground-primary">Last Login</h3>
          <p className="text-sm text-foreground-secondary mt-1">
            {user.lastLoginAt.toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Recent Activity & Security Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card-base">
          <h3 className="text-lg font-semibold text-foreground-primary mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {/* Activity items */}
            <div className="flex items-center space-x-3 p-3 bg-background-tertiary/50 rounded-lg">
              <div className="w-2 h-2 bg-status-success rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground-primary">
                  Successful login via biometrics
                </p>
                <p className="text-xs text-foreground-tertiary">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-background-tertiary/50 rounded-lg">
              <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground-primary">
                  New dApp connected: CryptoWallet Pro
                </p>
                <p className="text-xs text-foreground-tertiary">1 day ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-background-tertiary/50 rounded-lg">
              <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground-primary">
                  Device registered: iPhone 15 Pro
                </p>
                <p className="text-xs text-foreground-tertiary">3 days ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Alerts */}
        <div className="card-base">
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
                  Your account is fully secured with biometric authentication
                </p>
              </div>
            </div>
            
            {/* Recommendation */}
            <div className="flex items-start space-x-3 p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-accent-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground-primary">
                  Consider enabling 2FA backup
                </p>
                <p className="text-xs text-foreground-tertiary">
                  Add an extra layer of security for account recovery
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-base">
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
    </div>
  )
}