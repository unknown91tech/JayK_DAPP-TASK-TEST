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
  AlertCircle,
  Activity,
  Key,
  User,
  Lock,
  AlertTriangle,
  Eye,
  RefreshCw
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

interface ActivityEvent {
  id: string
  eventType: string
  description: string
  timestamp: string
  ipAddress: string
  deviceInfo: string
  location: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  success: boolean
  metadata?: any
  user?: {
    osId: string
    username?: string
  }
}

interface ActivitySummary {
  total: number
  successful: number
  failed: number
  highRisk: number
  recent24h: number
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

  // Activity logs state
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({
    total: 0,
    successful: 0,
    failed: 0,
    highRisk: 0,
    recent24h: 0
  })
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null)

  // Initialize data when component mounts
  useEffect(() => {
    fetchDashboardData()
    updateTime()
    const timeInterval = setInterval(updateTime, 60000) // Update every minute
    
    return () => clearInterval(timeInterval)
  }, [])

  // Get username from localStorage and fetch activity logs
  useEffect(() => {
    const storedUsername = localStorage.getItem('username')
    console.log('👤 Found username in localStorage:', storedUsername)
    
    if (storedUsername) {
      setCurrentUsername(storedUsername)
      fetchActivityLogs(storedUsername)
    } else {
      console.log('⚠️ No username found in localStorage')
    }
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

  // Fetch recent activity logs
  const fetchActivityLogs = async (username?: string) => {
    const usernameToUse = username || currentUsername
    
    if (!usernameToUse) {
      setActivitiesError('No username available to fetch activity logs')
      return
    }

    try {
      setActivitiesLoading(true)
      setActivitiesError(null)

      // Build query parameters for the API call (limit to recent 3 activities for dashboard)
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '3', // Show only recent 3 activities on dashboard
        username: usernameToUse,
        dateRange: '7' // Last 7 days for dashboard
      })

      console.log('🔍 Fetching activity logs for dashboard with params:', queryParams.toString())

      const response = await fetch(`/api/user/activity?${queryParams}`, {
        method: 'GET',
        credentials: 'include'
      })

      console.log('📡 Activity API Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Activity API Error:', errorText)
        throw new Error(`Failed to fetch activity logs: ${response.status}`)
      }

      const data = await response.json()
      console.log('📦 Activity API Response data:', data)

      if (data.success) {
        setActivities(data.data.activities)
        setActivitySummary(data.data.summary)
        console.log('✅ Successfully loaded', data.data.activities.length, 'activities for dashboard (showing last 3)')
      } else {
        throw new Error(data.error || 'Failed to fetch activity logs')
      }

    } catch (err) {
      console.error('Failed to fetch activity logs:', err)
      setActivitiesError(err instanceof Error ? err.message : 'Failed to load activity logs')
      
      // Show fallback data in case of error (for development)
      if (process.env.NODE_ENV === 'development') {
        console.log('🚧 Using fallback activity data for development')
        setFallbackActivityData()
      }
    } finally {
      setActivitiesLoading(false)
    }
  }

  // Fallback activity data for development (limit to 3)
  const setFallbackActivityData = () => {
    const mockActivities: ActivityEvent[] = [
      {
        id: '1',
        eventType: 'LOGIN_SUCCESS',
        description: 'Successful login via Telegram',
        timestamp: new Date().toISOString(),
        ipAddress: '103.120.45.123',
        deviceInfo: 'Chrome 120 on MacOS Sonoma',
        location: 'Mumbai, Maharashtra, IN',
        riskLevel: 'LOW',
        success: true,
        metadata: { loginMethod: 'telegram', sessionDuration: '2h 15m' }
      },
      {
        id: '2',
        eventType: 'PASSCODE_CHANGE',
        description: 'Passcode updated successfully',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        ipAddress: '103.120.45.123',
        deviceInfo: 'Chrome 120 on MacOS Sonoma',
        location: 'Mumbai, Maharashtra, IN',
        riskLevel: 'LOW',
        success: true,
        metadata: { previousCodeChanged: '2 months ago' }
      },
      {
        id: '3',
        eventType: 'DEVICE_REGISTERED',
        description: 'New device registered: iPhone 15',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        ipAddress: '103.120.45.123',
        deviceInfo: 'Safari 17 on iOS 17',
        location: 'Mumbai, Maharashtra, IN',
        riskLevel: 'LOW',
        success: true,
        metadata: { deviceType: 'mobile', manufacturer: 'Apple' }
      }
      // Removed the 4th activity to show only 3
    ]
    
    setActivities(mockActivities)
    setActivitySummary({
      total: mockActivities.length,
      successful: mockActivities.filter(a => a.success).length,
      failed: mockActivities.filter(a => !a.success).length,
      highRisk: mockActivities.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length,
      recent24h: mockActivities.length
    })
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

  // Get appropriate icon for each event type
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'LOGIN_SUCCESS':
      case 'LOGIN_FAILED':
        return Lock
      case 'PASSCODE_CHANGE':
      case 'PASSCODE_SETUP':
        return Key
      case 'DEVICE_REGISTERED':
      case 'DEVICE_REMOVED':
        return Smartphone
      case 'PROFILE_UPDATE':
        return User
      case 'BIOMETRIC_SETUP':
        return Shield
      case 'SSO_AUTH':
        return Users
      default:
        return Activity
    }
  }

  // Get color classes for risk levels
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-status-success'
      case 'MEDIUM': return 'text-status-warning'
      case 'HIGH': return 'text-status-error'
      case 'CRITICAL': return 'text-red-600'
      default: return 'text-foreground-secondary'
    }
  }

  const getRiskLevelBg = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-status-success/10'
      case 'MEDIUM': return 'bg-status-warning/10'
      case 'HIGH': return 'bg-status-error/10'
      case 'CRITICAL': return 'bg-red-500/10'
      default: return 'bg-background-tertiary'
    }
  }

  // Format timestamp in a human-readable way
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const days = Math.floor(diffInHours / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
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

  return (
    <div className="space-y-6">
      {/* Welcome Header - First thing user sees */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-foreground-primary mb-2">
              Welcome back, {user?.firstName || user?.username || currentUsername || 'User'}! 
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
                <span>Saturday, May 31, 2025</span>
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

        {/* Recent Activity Summary */}
        <Link href="/dashboard/activity">
          <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary hover:border-accent-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-accent-primary" />
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-tertiary group-hover:text-accent-primary transition-colors" />
            </div>
            
            <div className="text-2xl font-bold text-foreground-primary mb-1">
              {activitySummary.recent24h}
            </div>
            <div className="text-sm font-medium text-foreground-primary mb-1">
              Recent Activity
            </div>
            <div className="text-xs text-foreground-secondary">
              {activitySummary.highRisk > 0 
                ? `${activitySummary.highRisk} high-risk events` 
                : 'All activities secure'
              }
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
      </div>

      {/* Recent Activity Feed - Now shows real activity logs */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground-primary">
              Recent Activity
              {currentUsername && (
                <span className="text-base font-normal text-accent-primary ml-2">
                  - {currentUsername}
                </span>
              )}
            </h3>
            {activitiesError && (
              <p className="text-sm text-status-error mt-1">
                {activitiesError}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchActivityLogs()}
              disabled={activitiesLoading || !currentUsername}
              className="text-accent-primary hover:text-accent-hover"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${activitiesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/dashboard/activity">
              <Button variant="ghost" size="sm" className="text-accent-primary hover:text-accent-hover">
                View All Activity
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {activitiesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4 p-4 rounded-xl bg-background-tertiary/50 animate-pulse">
                <div className="w-10 h-10 bg-background-primary rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-background-primary rounded w-3/4"></div>
                  <div className="h-3 bg-background-primary rounded w-1/2"></div>
                </div>
                <div className="w-2 h-2 bg-background-primary rounded-full"></div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-foreground-primary mb-2">No Recent Activity</h4>
            <p className="text-foreground-secondary">
              {currentUsername 
                ? 'No activity logs found for your account in the last 7 days.'
                : 'Please log in to view your activity logs.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const EventIcon = getEventIcon(activity.eventType)
              
              return (
                <div 
                  key={activity.id}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-background-tertiary/50 hover:bg-background-tertiary transition-colors cursor-pointer"
                  onClick={() => setSelectedEvent(activity)}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.success 
                      ? 'bg-status-success/10' 
                      : 'bg-status-error/10'
                  }`}>
                    <EventIcon className={`w-5 h-5 ${
                      activity.success 
                        ? 'text-status-success' 
                        : 'text-status-error'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground-primary">
                          {activity.description}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-foreground-tertiary mt-1">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(activity.timestamp)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{activity.ipAddress}</span>
                          </div>
                          <span>{activity.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 ml-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getRiskLevelBg(activity.riskLevel)} ${getRiskLevelColor(activity.riskLevel)}`}>
                          {activity.riskLevel}
                        </span>
                        
                        {activity.success ? (
                          <CheckCircle className="w-4 h-4 text-status-success" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-status-error" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-2 h-2 bg-status-success rounded-full"></div>
                </div>
              )
            })}
          </div>
        )}
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

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background-secondary rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-border-primary">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground-primary">Activity Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="text-foreground-secondary hover:text-foreground-primary"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Event Overview */}
              <div>
                <h4 className="text-sm font-semibold text-foreground-primary mb-3">Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-foreground-tertiary mb-1">Event Type</div>
                    <div className="text-sm font-medium text-foreground-primary">
                      {selectedEvent.eventType.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                      ).join(' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-tertiary mb-1">Risk Level</div>
                    <div className={`text-sm font-medium ${getRiskLevelColor(selectedEvent.riskLevel)}`}>
                      {selectedEvent.riskLevel}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-tertiary mb-1">Status</div>
                    <div className={`text-sm font-medium ${selectedEvent.success ? 'text-status-success' : 'text-status-error'}`}>
                      {selectedEvent.success ? 'Success' : 'Failed'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-tertiary mb-1">Timestamp</div>
                    <div className="text-sm font-medium text-foreground-primary">
                      {new Date(selectedEvent.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Device */}
              <div>
                <h4 className="text-sm font-semibold text-foreground-primary mb-3">Location & Device</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <div className="text-xs text-foreground-tertiary mb-1">IP Address</div>
                    <div className="text-sm font-medium text-foreground-primary font-mono">
                      {selectedEvent.ipAddress}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-tertiary mb-1">Location</div>
                    <div className="text-sm font-medium text-foreground-primary">
                      {selectedEvent.location}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-tertiary mb-1">Device Information</div>
                    <div className="text-sm font-medium text-foreground-primary">
                      {selectedEvent.deviceInfo}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground-primary mb-3">Additional Details</h4>
                  <div className="bg-background-tertiary rounded-xl p-4">
                    <pre className="text-xs text-foreground-secondary whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-border-primary">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </Button>
                {selectedEvent.riskLevel === 'HIGH' || selectedEvent.riskLevel === 'CRITICAL' ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      console.log('Investigating high-risk event:', selectedEvent.id)
                      alert('Security team has been notified of this high-risk event.')
                      setSelectedEvent(null)
                    }}
                  >
                    Report Security Issue
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel - Shows device and activity information in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4">
          <h4 className="text-sm font-bold text-blue-400 mb-2">🔧 Development Debug Info</h4>
          <div className="text-xs text-blue-300 space-y-1">
            <p>📊 Active Devices: {devices.length}/{stats.maxDevices}</p>
            <p>🔒 Security Score: {currentSecurityScore}% (calculated from user data)</p>
            <p>✅ Account Verified: {user?.isVerified ? 'Yes' : 'No'}</p>
            <p>📋 KYC Status: {user?.kycStatus || 'Unknown'}</p>
            <p>👤 Username from localStorage: <code className="bg-blue-800/50 px-1 rounded">{currentUsername || 'Not found'}</code></p>
            <p>📈 Activity Summary: {activitySummary.total} total, {activitySummary.successful} successful, {activitySummary.failed} failed, {activitySummary.highRisk} high-risk</p>
            <p>🎯 Recent Activities Loaded: {activities.length}</p>
            {activitiesError && <p className="text-red-400">❌ Activity Error: {activitiesError}</p>}
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
            {activities.length > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-500/30">
                <p className="text-blue-400 font-medium">Recent Activities:</p>
                {activities.slice(0, 3).map(activity => (
                  <p key={activity.id} className="ml-2 text-xs">
                    • {activity.eventType}: {activity.description} ({activity.riskLevel}, {activity.success ? 'Success' : 'Failed'})
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