// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Smartphone, 
  Shield, 
  Users, 
  Clock, 
  Copy, 
  CheckCircle,
  ChevronRight,
  Calendar,
  MapPin,
  TrendingUp,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    activeDevices: 2,
    maxDevices: 5,
    securityScore: 98,
    connectedApps: 12,
    lastLogin: '5/30/2025'
  })
  const [copied, setCopied] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  // Initialize data when component mounts
  useEffect(() => {
    fetchUserData()
    updateTime()
    const timeInterval = setInterval(updateTime, 60000) // Update every minute
    
    return () => clearInterval(timeInterval)
  }, [])

  const updateTime = () => {
    const now = new Date()
    setCurrentTime(now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }))
  }

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.profile)
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  const copyOsId = async () => {
    if (user?.osId) {
      try {
        await navigator.clipboard.writeText(user.osId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy OS-ID:', error)
      }
    }
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-status-success'
    if (score >= 70) return 'text-status-warning'
    return 'text-status-error'
  }

  const getSecurityScoreText = (score: number) => {
    if (score >= 90) return 'Excellent security setup'
    if (score >= 70) return 'Good security setup'
    return 'Security needs improvement'
  }

  // Recent activity data for the user
  const recentActivities = [
    {
      action: 'Successful login via Telegram',
      time: 'Just now',
      icon: Shield,
      color: 'text-status-success'
    },
    {
      action: 'Device registered: iPhone 15',
      time: '2 hours ago',
      icon: Smartphone,
      color: 'text-accent-primary'
    },
    {
      action: 'Connected to new dApp',
      time: '1 day ago',
      icon: Users,
      color: 'text-accent-primary'
    },
    {
      action: 'Security scan completed',
      time: '2 days ago',
      icon: Shield,
      color: 'text-status-success'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header - First thing user sees */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-foreground-primary mb-2">
              Welcome back, {user?.firstName || user?.username || 'User'}! 
            </h2>
            <p className="text-foreground-secondary mb-4">
              Your OneStep authentication dashboard is ready. Everything looks secure and all systems are operating normally.
            </p>
            <div className="flex items-center space-x-6 text-sm text-foreground-tertiary">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Logged in at {currentTime}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Mumbai, Maharashtra, IN</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Friday, May 30, 2025</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 px-4 py-2 bg-status-success/10 border border-status-success/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-status-success" />
            <span className="text-sm font-medium text-status-success">Account Verified</span>
          </div>
        </div>
      </div>

      {/* OneStep ID Card - Core feature */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground-primary mb-2">
              Your OneStep ID
            </h3>
            <p className="text-foreground-secondary mb-6">
              Use this unique ID to sign into any dApp or service that supports OneStep authentication. Your ID never changes and works across all platforms.
            </p>
            
            <div className="bg-background-tertiary rounded-xl p-6 border border-border-primary">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-mono font-bold text-accent-primary">
                  {user?.osId || 'OS-2024-ABC123DEF'}
                </span>
                <button
                  onClick={copyOsId}
                  className="p-3 hover:bg-background-primary rounded-lg transition-colors"
                  title="Copy OS-ID to clipboard"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-status-success" />
                  ) : (
                    <Copy className="w-5 h-5 text-foreground-secondary" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-foreground-tertiary">
                <Shield className="w-4 h-4" />
                <span>💡 Your OS-ID is permanent and works everywhere OneStep is supported</span>
              </div>
            </div>
          </div>

          <div className="ml-8">
            <div className="w-20 h-20 bg-accent-primary/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-accent-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Key metrics at a glance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Devices Status */}
        <Link href="/dashboard/devices">
          <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary hover:border-accent-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-accent-primary" />
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-tertiary group-hover:text-accent-primary transition-colors" />
            </div>
            
            <div className="text-2xl font-bold text-foreground-primary mb-1">
              {stats.activeDevices}/{stats.maxDevices}
            </div>
            <div className="text-sm font-medium text-foreground-primary mb-1">
              Active Devices
            </div>
            <div className="text-xs text-foreground-secondary">
              Manage your trusted devices
            </div>
          </div>
        </Link>

        {/* Security Score */}
        <Link href="/dashboard/security">
          <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary hover:border-accent-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-status-success/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-status-success" />
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-tertiary group-hover:text-accent-primary transition-colors" />
            </div>
            
            <div className={`text-2xl font-bold mb-1 ${getSecurityScoreColor(stats.securityScore)}`}>
              {stats.securityScore}%
            </div>
            <div className="text-sm font-medium text-foreground-primary mb-1">
              Security Score
            </div>
            <div className="text-xs text-foreground-secondary">
              {getSecurityScoreText(stats.securityScore)}
            </div>
          </div>
        </Link>

        {/* Connected dApps */}
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-primary" />
            </div>
            <TrendingUp className="w-4 h-4 text-status-success" />
          </div>
          
          <div className="text-2xl font-bold text-foreground-primary mb-1">
            {stats.connectedApps}
          </div>
          <div className="text-sm font-medium text-foreground-primary mb-1">
            Connected dApps
          </div>
          <div className="text-xs text-foreground-secondary">
            Applications using your OneStep ID
          </div>
        </div>

        {/* Last Login Time */}
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-accent-primary" />
            </div>
            <Zap className="w-4 h-4 text-accent-primary" />
          </div>
          
          <div className="text-2xl font-bold text-foreground-primary mb-1">
            {stats.lastLogin}
          </div>
          <div className="text-sm font-medium text-foreground-primary mb-1">
            Last Login
          </div>
          <div className="text-xs text-foreground-secondary">
            Previous session activity
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground-primary">
            Recent Activity
          </h3>
          <Link href="/dashboard/activity">
            <Button variant="ghost" size="sm" className="text-accent-primary hover:text-accent-hover">
              View All Activity
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 rounded-xl bg-background-tertiary/50 hover:bg-background-tertiary transition-colors">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-background-primary`}>
                <activity.icon className={`w-5 h-5 ${activity.color}`} />
              </div>
              
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground-primary">
                  {activity.action}
                </div>
                <div className="text-xs text-foreground-tertiary">
                  {activity.time}
                </div>
              </div>

              <div className="w-2 h-2 bg-status-success rounded-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions - Main features user can access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/devices">
          <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary hover:border-accent-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-lg">
            <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-accent-primary" />
            </div>
            <h4 className="text-lg font-semibold text-foreground-primary mb-2">
              Manage Devices
            </h4>
            <p className="text-sm text-foreground-secondary mb-4">
              Add, remove, or view your trusted devices. Keep your account secure by managing device access.
            </p>
            <div className="flex items-center text-accent-primary group-hover:text-accent-hover transition-colors">
              <span className="text-sm font-medium">Manage Devices</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/security">
          <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary hover:border-accent-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-lg">
            <div className="w-12 h-12 bg-status-success/10 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-status-success" />
            </div>
            <h4 className="text-lg font-semibold text-foreground-primary mb-2">
              Security Settings
            </h4>
            <p className="text-sm text-foreground-secondary mb-4">
              Review and update your security preferences. Monitor suspicious activity and enhance protection.
            </p>
            <div className="flex items-center text-accent-primary group-hover:text-accent-hover transition-colors">
              <span className="text-sm font-medium">View Security</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/kyc">
          <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary hover:border-accent-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-lg">
            <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-accent-primary" />
            </div>
            <h4 className="text-lg font-semibold text-foreground-primary mb-2">
              Verification Status
            </h4>
            <p className="text-sm text-foreground-secondary mb-4">
              Check your KYC verification status and complete any pending verification requirements.
            </p>
            <div className="flex items-center text-accent-primary group-hover:text-accent-hover transition-colors">
              <span className="text-sm font-medium">Check Status</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}