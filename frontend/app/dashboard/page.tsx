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
  Zap,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// TypeScript interfaces for our data structures
interface Device {
  id: string
  deviceName: string
  deviceType: string
  createdAt: string
  lastUsedAt: string
  isActive: boolean
}

interface UserProfile {
  osId: string
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  isVerified: boolean
  kycStatus: string
}

interface DashboardStats {
  activeDevices: number
  maxDevices: number
  securityScore: number
  connectedApps: number
  lastLogin: string
}

export default function DashboardPage() {
  // State management for all our dashboard data
  const [user, setUser] = useState<UserProfile | null>(null)
  const [devices, setDevices] = useState<Device[]>([]) // Real device data from backend
  const [stats, setStats] = useState<DashboardStats>({
    activeDevices: 0, // Will be calculated from actual devices
    maxDevices: 5, // This stays constant as per business rules
    securityScore: 98, // Could be calculated based on user's security setup
    connectedApps: 12, // This would come from SSO sessions in a real app
    lastLogin: '5/30/2025' // Could be from user.lastLoginAt
  })
  const [copied, setCopied] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [loading, setLoading] = useState(true) // Track loading state
  const [error, setError] = useState<string | null>(null) // Track any errors

  // Initialize data when component mounts
  useEffect(() => {
    fetchDashboardData()
    updateTime()
    const timeInterval = setInterval(updateTime, 60000) // Update every minute
    
    return () => clearInterval(timeInterval)
  }, [])

  // Update the current time display
  const updateTime = () => {
    const now = new Date()
    setCurrentTime(now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }))
  }

  // Fetch all dashboard data from our APIs
  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch user profile and devices in parallel for better performance
      const [profileResponse, devicesResponse] = await Promise.all([
        fetch('/api/user/profile', { credentials: 'include' }),
        fetch('/api/user/devices', { credentials: 'include' })
      ])

      // Handle user profile response
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setUser(profileData.profile)
        console.log('✅ User profile loaded:', profileData.profile)
      } else {
        console.error('❌ Failed to fetch user profile:', profileResponse.status)
      }

      // Handle devices response
      if (devicesResponse.ok) {
        const devicesData = await devicesResponse.json()
        setDevices(devicesData.devices || [])
        
        // Update stats with real device count
        setStats(prevStats => ({
          ...prevStats,
          activeDevices: devicesData.devices?.length || 0
        }))
        
        console.log('✅ User devices loaded:', devicesData.devices)
      } else {
        console.error('❌ Failed to fetch devices:', devicesResponse.status)
        // If we can't fetch devices, show an error but don't break the whole dashboard
        const errorData = await devicesResponse.json().catch(() => ({}))
        setError(errorData.error || 'Failed to load device information')
      }

    } catch (error) {
      console.error('❌ Dashboard data fetch error:', error)
      setError('Failed to load dashboard data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  // Copy OS-ID to clipboard
  const copyOsId = async () => {
    if (user?.osId) {
      try {
        await navigator.clipboard.writeText(user.osId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        console.log('📋 OS-ID copied to clipboard:', user.osId)
      } catch (error) {
        console.error('❌ Failed to copy OS-ID:', error)
      }
    }
  }

  // Calculate security score based on user's setup
  const calculateSecurityScore = (): number => {
    let score = 50 // Base score
    
    if (user?.isVerified) score += 20 // Account verified
    if (devices.length > 0) score += 15 // Has registered devices
    if (devices.length >= 2) score += 10 // Multiple devices for better security
    if (user?.kycStatus === 'APPROVED') score += 5 // KYC completed
    
    return Math.min(score, 100) // Cap at 100
  }

  // Get color for security score display
  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-status-success'
    if (score >= 70) return 'text-status-warning'
    return 'text-status-error'
  }

  // Get descriptive text for security score
  const getSecurityScoreText = (score: number) => {
    if (score >= 90) return 'Excellent security setup'
    if (score >= 70) return 'Good security setup'
    return 'Security needs improvement'
  }

  // Generate recent activity based on real device data
  const generateRecentActivities = () => {
    const activities = [
      {
        action: 'Successful login via Telegram',
        time: 'Just now',
        icon: Shield,
        color: 'text-status-success'
      }
    ]

    // Add device-related activities
    if (devices.length > 0) {
      const latestDevice = devices.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
      
      const deviceAge = new Date().getTime() - new Date(latestDevice.createdAt).getTime()
      const hoursAgo = Math.floor(deviceAge / (1000 * 60 * 60))
      
      if (hoursAgo < 24) {
        activities.push({
          action: `Device registered: ${latestDevice.deviceName}`,
          time: hoursAgo === 0 ? 'Less than an hour ago' : `${hoursAgo} hours ago`,
          icon: Smartphone,
          color: 'text-accent-primary'
        })
      }
    }

    // Add some default activities
    activities.push(
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
    )

    return activities
  }

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary animate-pulse">
          <div className="h-8 bg-background-tertiary rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-background-tertiary rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-background-tertiary rounded w-1/2"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-background-secondary rounded-2xl p-6 border border-border-primary animate-pulse">
              <div className="h-12 w-12 bg-background-tertiary rounded-xl mb-4"></div>
              <div className="h-6 bg-background-tertiary rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-background-tertiary rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Calculate current security score
  const currentSecurityScore = calculateSecurityScore()
  const recentActivities = generateRecentActivities()

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
            <span className="text-sm font-medium text-status-success">
              {user?.isVerified ? 'Account Verified' : 'Verification Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message - Show if there's an issue loading data */}
      {error && (
        <div className="bg-status-error/10 border border-status-error/20 rounded-2xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-status-error" />
            <span className="text-status-error font-medium">{error}</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={fetchDashboardData}
              className="ml-auto text-status-error hover:text-status-error"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

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
                  {user?.osId || 'Loading...'}
                </span>
                <button
                  onClick={copyOsId}
                  className="p-3 hover:bg-background-primary rounded-lg transition-colors"
                  title="Copy OS-ID to clipboard"
                  disabled={!user?.osId}
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

      {/* Stats Grid - Key metrics from real data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Devices Status - Now using real data */}
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
              {devices.length === 0 
                ? 'No devices registered yet' 
                : `${devices.length} device${devices.length === 1 ? '' : 's'} trusted`
              }
            </div>
          </div>
        </Link>

        {/* Security Score - Now calculated from real data */}
        <Link href="/dashboard/security">
          <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary hover:border-accent-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-status-success/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-status-success" />
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-tertiary group-hover:text-accent-primary transition-colors" />
            </div>
            
            <div className={`text-2xl font-bold mb-1 ${getSecurityScoreColor(currentSecurityScore)}`}>
              {currentSecurityScore}%
            </div>
            <div className="text-sm font-medium text-foreground-primary mb-1">
              Security Score
            </div>
            <div className="text-xs text-foreground-secondary">
              {getSecurityScoreText(currentSecurityScore)}
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

      {/* Recent Activity Feed - Now includes real device data */}
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
              {devices.length > 0 && (
                <span className="block mt-2 text-accent-primary font-medium">
                  {devices.length} device{devices.length === 1 ? '' : 's'} currently registered
                </span>
              )}
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
              <span className="block mt-2 text-status-success font-medium">
                Current score: {currentSecurityScore}%
              </span>
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
              {user?.kycStatus && (
                <span className="block mt-2 font-medium capitalize">
                  Status: <span className={
                    user.kycStatus === 'APPROVED' ? 'text-status-success' :
                    user.kycStatus === 'IN_PROGRESS' ? 'text-status-warning' :
                    'text-status-error'
                  }>
                    {user.kycStatus.replace('_', ' ').toLowerCase()}
                  </span>
                </span>
              )}
            </p>
            <div className="flex items-center text-accent-primary group-hover:text-accent-hover transition-colors">
              <span className="text-sm font-medium">Check Status</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>
      </div>

      {/* Debug Panel - Shows device information in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4">
          <h4 className="text-sm font-bold text-blue-400 mb-2">🔧 Development Debug Info</h4>
          <div className="text-xs text-blue-300 space-y-1">
            <p>📊 Active Devices: {devices.length}/{stats.maxDevices}</p>
            <p>🔒 Security Score: {currentSecurityScore}% (calculated from user data)</p>
            <p>✅ Account Verified: {user?.isVerified ? 'Yes' : 'No'}</p>
            <p>📋 KYC Status: {user?.kycStatus || 'Unknown'}</p>
            {devices.length > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-500/30">
                <p className="text-blue-400 font-medium">Registered Devices:</p>
                {devices.map(device => (
                  <p key={device.id} className="ml-2">
                    • {device.deviceName} ({device.deviceType}) - {new Date(device.lastUsedAt).toLocaleDateString()}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}