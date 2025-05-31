// app/dashboard/activity/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  Shield, 
  Key, 
  Smartphone, 
  User, 
  Clock, 
  MapPin, 
  Filter, 
  Download, 
  Search,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Eye,
  Lock,
  Unlock,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Type definitions for our activity data
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

interface ActivityFilters {
  eventType: string
  riskLevel: string
  dateRange: string
  searchTerm: string
  username: string // New filter for specific username
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ActivityPage() {
  // State management for the page
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [summary, setSummary] = useState<ActivitySummary>({
    total: 0,
    successful: 0,
    failed: 0,
    highRisk: 0,
    recent24h: 0
  })
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState<string>('')
  
  // Filter states
  const [filters, setFilters] = useState<ActivityFilters>({
    eventType: 'all',
    riskLevel: 'all',
    dateRange: '30',
    searchTerm: '',
    username: '' // Will be populated from localStorage
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null)

  // Get username from localStorage when component mounts
  useEffect(() => {
    const storedUsername = localStorage.getItem('username')
    console.log('👤 Found username in localStorage:', storedUsername)
    
    if (storedUsername) {
      setCurrentUsername(storedUsername)
      setFilters(prev => ({ ...prev, username: storedUsername }))
    } else {
      console.log('⚠️ No username found in localStorage')
      setError('No username found in localStorage. Please log in first.')
    }
  }, [])

  // Load activity logs when component mounts or filters change
  useEffect(() => {
    // Only fetch if we have a username (either from localStorage or manually entered)
    if (filters.username) {
      fetchActivityLogs()
    }
  }, [filters, pagination.page])

  // Function to fetch activity logs from our API
  const fetchActivityLogs = async () => {
    // Don't fetch if no username is available
    if (!filters.username) {
      setError('Username is required to fetch activity logs')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Build query parameters for the API call
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        username: filters.username // Always include username from localStorage or input
      })

      // Add other filters to query if they're not 'all'
      if (filters.eventType && filters.eventType !== 'all') {
        queryParams.append('eventType', filters.eventType)
      }
      if (filters.riskLevel && filters.riskLevel !== 'all') {
        queryParams.append('riskLevel', filters.riskLevel)
      }
      if (filters.dateRange && filters.dateRange !== '0') {
        queryParams.append('dateRange', filters.dateRange)
      }
      if (filters.searchTerm) {
        queryParams.append('searchTerm', filters.searchTerm)
      }

      console.log('🔍 Fetching activity logs with params:', queryParams.toString())

      // Make the API call to fetch activity logs
      const response = await fetch(`/api/user/activity?${queryParams}`, {
        method: 'GET',
        credentials: 'include' // Include cookies for authentication
      })

      console.log('📡 API Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        throw new Error(`Failed to fetch activity logs: ${response.status}`)
      }

      const data = await response.json()
      console.log('📦 API Response data:', data)

      if (data.success) {
        // Update state with the fetched data
        setActivities(data.data.activities)
        setSummary(data.data.summary)
        setPagination(prev => ({
          ...prev,
          ...data.data.pagination
        }))
        
        console.log('✅ Successfully loaded', data.data.activities.length, 'activities for user:', filters.username)
        
        // Show which user's logs we're viewing
        if (data.data.targetUser) {
          console.log('👤 Viewing logs for user:', data.data.targetUser.username || data.data.targetUser.osId)
        }
      } else {
        throw new Error(data.error || 'Failed to fetch activity logs')
      }

    } catch (err) {
      console.error('Failed to fetch activity logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activity logs')
      
      // Show fallback data in case of error (for development)
      if (process.env.NODE_ENV === 'development') {
        console.log('🚧 Using fallback data for development')
        setFallbackData()
      }
    } finally {
      setLoading(false)
    }
  }

  // Fallback data for development when API fails
  const setFallbackData = () => {
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
        eventType: 'LOGIN_FAILED',
        description: 'Failed login attempt - Invalid OTP',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        ipAddress: '45.123.67.89',
        deviceInfo: 'Firefox 119 on Windows 11',
        location: 'Unknown Location',
        riskLevel: 'HIGH',
        success: false,
        metadata: { attempts: 3, reason: 'Invalid OTP code' }
      }
    ]
    
    setActivities(mockActivities)
    setSummary({
      total: mockActivities.length,
      successful: mockActivities.filter(a => a.success).length,
      failed: mockActivities.filter(a => !a.success).length,
      highRisk: mockActivities.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length,
      recent24h: mockActivities.length
    })
  }

  // Update filter and reset to first page
  const updateFilter = (key: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle page changes
  const changePage = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Export activity report as CSV
  const exportActivityReport = async () => {
    try {
      // Create CSV content from current activities
      const csvContent = [
        'Timestamp,Event Type,Description,User,IP Address,Device,Location,Risk Level,Success',
        ...activities.map(activity => 
          `"${activity.timestamp}","${activity.eventType}","${activity.description}","${activity.user ? (activity.user.username || activity.user.osId) : 'N/A'}","${activity.ipAddress}","${activity.deviceInfo}","${activity.location}","${activity.riskLevel}","${activity.success}"`
        )
      ].join('\n')
      
      // Create filename based on whether we're filtering by username
      const baseFilename = filters.username 
        ? `activity-report-${filters.username}-${new Date().toISOString().split('T')[0]}.csv`
        : `activity-report-${new Date().toISOString().split('T')[0]}.csv`
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = baseFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export report:', err)
    }
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

  // Convert event type from API format to display format
  const getEventTypeLabel = (eventType: string) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-foreground-secondary">
          {filters.username ? `Loading activity logs for ${filters.username}...` : 'Loading...'}
        </span>
      </div>
    )
  }

  // Show error state if data fetch failed or no username
  if (error && activities.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-status-error mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground-primary mb-2">
          {error.includes('localStorage') ? 'No Username Found' : 'Failed to Load Activity Logs'}
        </h3>
        <p className="text-foreground-secondary mb-4">{error}</p>
        <div className="flex justify-center space-x-3">
          <Button onClick={fetchActivityLogs} variant="primary" disabled={!filters.username}>
            Try Again
          </Button>
          {error.includes('localStorage') && (
            <Button 
              onClick={() => {
                const username = prompt('Enter username manually:')
                if (username) {
                  setFilters(prev => ({ ...prev, username }))
                  setCurrentUsername(username)
                }
              }} 
              variant="secondary"
            >
              Enter Username Manually
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground-primary">
            Activity Logs
            {currentUsername && (
              <span className="text-lg font-normal text-accent-primary ml-2">
                - {currentUsername}
              </span>
            )}
          </h1>
          <p className="text-foreground-secondary">
            {currentUsername 
              ? `Viewing security activity logs for: ${currentUsername}`
              : "Please log in to view your activity logs"
            }
          </p>
          {currentUsername && (
            <p className="text-xs text-foreground-tertiary mt-1">
              Username loaded from localStorage
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="secondary" 
            onClick={fetchActivityLogs}
            disabled={loading || !filters.username}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={exportActivityReport}
            disabled={activities.length === 0}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Activity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-status-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground-primary">
                {summary.successful}
              </div>
              <div className="text-sm text-foreground-secondary">Successful</div>
            </div>
          </div>
        </div>

        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-status-error/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-status-error" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground-primary">
                {summary.failed}
              </div>
              <div className="text-sm text-foreground-secondary">Failed</div>
            </div>
          </div>
        </div>

        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-status-warning/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-status-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground-primary">
                {summary.highRisk}
              </div>
              <div className="text-sm text-foreground-secondary">High Risk</div>
            </div>
          </div>
        </div>

        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground-primary">{summary.recent24h}</div>
              <div className="text-sm text-foreground-secondary">Recent 24h</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground-primary">Filter Activities</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Username Filter */}
          <div>
            <Input
              placeholder="Username (auto-loaded from localStorage)"
              value={filters.username}
              onChange={(e) => updateFilter('username', e.target.value)}
              startIcon={<User className="w-4 h-4" />}
              label="Current User"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-foreground-tertiary">
                {currentUsername ? '✅ Auto-loaded from localStorage' : '❌ No username in localStorage'}
              </p>
              {currentUsername && filters.username !== currentUsername && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, username: currentUsername }))}
                  className="text-xs text-accent-primary hover:text-accent-hover"
                >
                  Reset to {currentUsername}
                </button>
              )}
            </div>
          </div>
          
          {/* General Search */}
          <div>
            <Input
              placeholder="Search activities, IP addresses, or devices..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              startIcon={<Search className="w-4 h-4" />}
              label="Search Activities"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Event Type
              </label>
              <select
                value={filters.eventType}
                onChange={(e) => updateFilter('eventType', e.target.value)}
                className="w-full px-4 py-3 bg-background-tertiary border border-border-primary rounded-xl text-foreground-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="all">All Events</option>
                <option value="LOGIN_SUCCESS">Login Success</option>
                <option value="LOGIN_FAILED">Login Failed</option>
                <option value="PASSCODE_CHANGE">Passcode Change</option>
                <option value="DEVICE_REGISTERED">Device Registered</option>
                <option value="PROFILE_UPDATE">Profile Update</option>
                <option value="SSO_AUTH">SSO Authentication</option>
                <option value="BIOMETRIC_SETUP">Biometric Setup</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Risk Level
              </label>
              <select
                value={filters.riskLevel}
                onChange={(e) => updateFilter('riskLevel', e.target.value)}
                className="w-full px-4 py-3 bg-background-tertiary border border-border-primary rounded-xl text-foreground-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="all">All Levels</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical Risk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => updateFilter('dateRange', e.target.value)}
                className="w-full px-4 py-3 bg-background-tertiary border border-border-primary rounded-xl text-foreground-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="0">All time</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="bg-background-secondary rounded-2xl border border-border-primary overflow-hidden">
        <div className="p-6 border-b border-border-primary">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground-primary">
              Recent Activity ({summary.total} total)
            </h3>
          </div>
        </div>

        <div className="divide-y divide-border-primary">
          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground-primary mb-2">No Activities Found</h3>
              <p className="text-foreground-secondary">
                {filters.searchTerm || filters.eventType !== 'all' || filters.riskLevel !== 'all'
                  ? 'No activities match your current filter criteria.'
                  : 'No activity logs available for your account.'}
              </p>
            </div>
          ) : (
            activities.map((activity) => {
              const EventIcon = getEventIcon(activity.eventType)
              
              return (
                <div 
                  key={activity.id}
                  className="p-6 hover:bg-background-tertiary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEvent(activity)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Event Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      activity.success 
                        ? 'bg-status-success/10' 
                        : 'bg-status-error/10'
                    }`}>
                      <EventIcon className={`w-6 h-6 ${
                        activity.success 
                          ? 'text-status-success' 
                          : 'text-status-error'
                      }`} />
                    </div>

                    {/* Event Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground-primary mb-1">
                            {activity.description}
                          </h4>
                          
                          <div className="flex items-center space-x-4 text-sm text-foreground-tertiary">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(activity.timestamp)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{activity.ipAddress}</span>
                            </div>
                            <span>{activity.location}</span>
                            {/* Show user info if available (for all logs view) */}
                            {activity.user && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span className="font-medium text-accent-primary">
                                  {activity.user.username || activity.user.osId}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs text-foreground-tertiary mt-1">
                            {activity.deviceInfo}
                          </div>
                        </div>

                        {/* Risk Level & Status */}
                        <div className="flex items-center space-x-3">
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
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-6 border-t border-border-primary">
            <div className="flex items-center justify-between">
              <div className="text-sm text-foreground-secondary">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} activities
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = pagination.page <= 3 
                      ? i + 1 
                      : pagination.page >= pagination.totalPages - 2
                        ? pagination.totalPages - 4 + i
                        : pagination.page - 2 + i
                    
                    if (pageNum < 1 || pageNum > pagination.totalPages) return null
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => changePage(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          pageNum === pagination.page
                            ? 'bg-accent-primary text-background-primary'
                            : 'text-foreground-secondary hover:bg-background-tertiary'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background-secondary rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-border-primary">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground-primary">Event Details</h3>
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
                      {getEventTypeLabel(selectedEvent.eventType)}
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
                      // In a real app, this would trigger security actions
                      console.log('Investigating high-risk event:', selectedEvent.id)
                      alert('Security team has been notified of this high-risk event.')
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

      {/* Development Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h4 className="text-sm font-bold text-blue-400 mb-2">🔧 Development Debug Info</h4>
          <div className="text-xs text-blue-300 space-y-1">
            <p><strong>Username from localStorage:</strong> <code className="bg-blue-800/50 px-1 rounded">{currentUsername || 'Not found'}</code></p>
            <p><strong>Current filter username:</strong> <code className="bg-blue-800/50 px-1 rounded">{filters.username || 'Empty'}</code></p>
            <p><strong>API Endpoint:</strong> <code className="bg-blue-800/50 px-1 rounded">/api/user/activity?username={filters.username}</code></p>
            <p><strong>Activities loaded:</strong> <code className="bg-blue-800/50 px-1 rounded">{activities.length}</code></p>
            <p><strong>Current Filters:</strong> <code className="bg-blue-800/50 px-1 rounded">{JSON.stringify(filters)}</code></p>
            {error && <p className="text-red-400"><strong>Error:</strong> {error}</p>}
            <div className="mt-3 pt-2 border-t border-blue-500/30">
              <p className="text-yellow-400">💡 To test different users:</p>
              <p className="text-xs">1. Change username in the input field above</p>
              <p className="text-xs">2. Or run: <code className="bg-blue-800/50 px-1 rounded">localStorage.setItem('username', 'new_username')</code></p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}