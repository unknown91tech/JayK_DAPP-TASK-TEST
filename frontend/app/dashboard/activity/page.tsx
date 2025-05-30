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
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
}

interface ActivityFilters {
  eventType: string
  riskLevel: string
  dateRange: string
  searchTerm: string
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ActivityFilters>({
    eventType: 'all',
    riskLevel: 'all',
    dateRange: '30',
    searchTerm: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null)

  useEffect(() => {
    fetchActivityLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [activities, filters])

  const fetchActivityLogs = async () => {
    try {
      // Mock data - in a real app, this would come from an API
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
          description: 'New device registered: iPhone 15 Pro',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          ipAddress: '103.120.45.124',
          deviceInfo: 'Safari 17 on iOS 17.2',
          location: 'Mumbai, Maharashtra, IN',
          riskLevel: 'MEDIUM',
          success: true,
          metadata: { deviceName: 'iPhone 15 Pro', fingerprint: 'abc123...' }
        },
        {
          id: '4',
          eventType: 'LOGIN_FAILED',
          description: 'Failed login attempt - Invalid OTP',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          ipAddress: '45.123.67.89',
          deviceInfo: 'Firefox 119 on Windows 11',
          location: 'Unknown Location',
          riskLevel: 'HIGH',
          success: false,
          metadata: { attempts: 3, reason: 'Invalid OTP code' }
        },
        {
          id: '5',
          eventType: 'PROFILE_UPDATE',
          description: 'Profile information updated',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ipAddress: '103.120.45.123',
          deviceInfo: 'Chrome 120 on MacOS Sonoma',
          location: 'Mumbai, Maharashtra, IN',
          riskLevel: 'LOW',
          success: true,
          metadata: { fieldsUpdated: ['firstName', 'email'] }
        },
        {
          id: '6',
          eventType: 'SSO_AUTH',
          description: 'Connected to DeFi dApp',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          ipAddress: '103.120.45.123',
          deviceInfo: 'Chrome 120 on MacOS Sonoma',
          location: 'Mumbai, Maharashtra, IN',
          riskLevel: 'LOW',
          success: true,
          metadata: { dappName: 'UniSwap V4', permissions: ['profile', 'wallet'] }
        },
        {
          id: '7',
          eventType: 'BIOMETRIC_SETUP',
          description: 'Touch ID authentication enabled',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          ipAddress: '103.120.45.124',
          deviceInfo: 'Safari 17 on iOS 17.2',
          location: 'Mumbai, Maharashtra, IN',
          riskLevel: 'LOW',
          success: true,
          metadata: { biometricType: 'touch', deviceId: 'iPhone-15-Pro' }
        }
      ]
      
      setActivities(mockActivities)
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...activities]

    // Filter by event type
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(activity => activity.eventType === filters.eventType)
    }

    // Filter by risk level
    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(activity => activity.riskLevel === filters.riskLevel)
    }

    // Filter by date range
    const now = new Date()
    const daysAgo = parseInt(filters.dateRange)
    if (daysAgo > 0) {
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(activity => new Date(activity.timestamp) >= cutoffDate)
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(searchLower) ||
        activity.ipAddress.includes(searchLower) ||
        activity.location.toLowerCase().includes(searchLower)
      )
    }

    setFilteredActivities(filtered)
  }

  const updateFilter = (key: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const exportActivityReport = async () => {
    // In a real app, this would generate and download a CSV/PDF report
    const csvContent = [
      'Timestamp,Event Type,Description,IP Address,Device,Location,Risk Level,Success',
      ...filteredActivities.map(activity => 
        `${activity.timestamp},${activity.eventType},${activity.description},${activity.ipAddress},${activity.deviceInfo},${activity.location},${activity.riskLevel},${activity.success}`
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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

  const getEventTypeLabel = (eventType: string) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground-primary">Activity Logs</h1>
          <p className="text-foreground-secondary">Monitor all account activity and security events</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="secondary" 
            onClick={fetchActivityLogs}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={exportActivityReport}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-status-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground-primary">
                {activities.filter(a => a.success).length}
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
                {activities.filter(a => !a.success).length}
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
                {activities.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length}
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
              <div className="text-2xl font-bold text-foreground-primary">24h</div>
              <div className="text-sm text-foreground-secondary">Recent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
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

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Search activities..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filter Options */}
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
              Recent Activity ({filteredActivities.length})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-border-primary">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground-primary mb-2">No Activities Found</h3>
              <p className="text-foreground-secondary">
                No activities match your current filter criteria.
              </p>
            </div>
          ) : (
            filteredActivities.map((activity) => {
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
                    <div className="text-xs text-foreground-tertiary">Event Type</div>
                    <div className="text-sm font-medium text-foreground-primary">
                      {getEventTypeLabel(selectedEvent.eventType)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-tertiary">Risk Level</div>
                    <div className={`text-sm font-medium ${getRiskLevelColor(selectedEvent.riskLevel)}`}>
                      {selectedEvent.riskLevel}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-tertiary">Status</div>
                    <div className={`text-sm font-medium ${selectedEvent.success ? 'text-status-success' : 'text-status-error'}`}>
                      {selectedEvent.success ? 'Success' : 'Failed'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-tertiary">Timestamp</div>
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
                    <div className="text-xs text-foreground-tertiary">IP Address</div>
                    <div className="text-sm font-medium text-foreground-primary">{selectedEvent.ipAddress}</div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-tertiary">Location</div>
                    <div className="text-sm font-medium text-foreground-primary">{selectedEvent.location}</div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-tertiary">Device</div>
                    <div className="text-sm font-medium text-foreground-primary">{selectedEvent.deviceInfo}</div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {selectedEvent.metadata && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground-primary mb-3">Additional Details</h4>
                  <div className="bg-background-tertiary rounded-xl p-4">
                    <pre className="text-xs text-foreground-secondary whitespace-pre-wrap">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}