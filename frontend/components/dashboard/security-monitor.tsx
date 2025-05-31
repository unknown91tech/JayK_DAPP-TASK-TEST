"use client";

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSecurityMonitoring } from '@/hooks/use-security-monitoring'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Eye,
  Clock,
  MapPin,
  RefreshCw
} from 'lucide-react'

export function SecurityMonitor() {
  const { events, stats, loading, getHighRiskEvents, hasRecentAlerts } = useSecurityMonitoring()
  const [refreshing, setRefreshing] = useState(false)

  // Refresh security data
  const handleRefresh = async () => {
    setRefreshing(true)
    // This would trigger a refresh of security data
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Format risk level for display
  const getRiskBadge = (riskLevel: string) => {
    const riskConfig = {
      LOW: { variant: 'success' as const, label: 'Low', icon: '🟢' },
      MEDIUM: { variant: 'warning' as const, label: 'Medium', icon: '🟡' },
      HIGH: { variant: 'error' as const, label: 'High', icon: '🟠' },
      CRITICAL: { variant: 'error' as const, label: 'Critical', icon: '🔴' }
    }
    
    return riskConfig[riskLevel as keyof typeof riskConfig] || riskConfig.LOW
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground-primary">Security Monitor</h2>
          <p className="text-foreground-secondary">
            Real-time security monitoring and threat detection
          </p>
        </div>
        
        <Button 
          variant="secondary" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Security Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Security Score</p>
                <p className="text-3xl font-bold text-status-success">98%</p>
              </div>
              <Shield className="w-8 h-8 text-status-success" />
            </div>
            <p className="text-xs text-foreground-tertiary mt-2">Excellent security posture</p>
          </CardContent>
        </Card>

        {/* Active Threats */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Active Threats</p>
                <p className="text-3xl font-bold text-foreground-primary">0</p>
              </div>
              <CheckCircle className="w-8 h-8 text-status-success" />
            </div>
            <p className="text-xs text-foreground-tertiary mt-2">No threats detected</p>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Recent Alerts</p>
                <p className="text-3xl font-bold text-foreground-primary">{stats.recentAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-status-warning" />
            </div>
            <p className="text-xs text-foreground-tertiary mt-2">Last 24 hours</p>
          </CardContent>
        </Card>

        {/* Total Events */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Total Events</p>
                <p className="text-3xl font-bold text-foreground-primary">{stats.totalEvents}</p>
              </div>
              <Activity className="w-8 h-8 text-accent-primary" />
            </div>
            <p className="text-xs text-foreground-tertiary mt-2">All time monitoring</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Security Events
          </CardTitle>
          <CardDescription>
            Latest security events and system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-background-tertiary rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-background-tertiary rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events.slice(0, 10).map((event) => {
                const riskBadge = getRiskBadge(event.riskLevel)
                
                return (
                  <div key={event.id} className="flex items-start space-x-3 p-3 bg-background-tertiary/50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-lg">{riskBadge.icon}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground-primary">
                          {event.description}
                        </p>
                        <Badge variant={riskBadge.variant} className="ml-2">
                          {riskBadge.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-xs text-foreground-tertiary">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(event.timestamp)}
                        </div>
                        
                        {event.ipAddress && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {event.ipAddress}
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {event.eventType}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {events.length > 10 && (
                <div className="text-center pt-4">
                  <Button variant="secondary" size="sm">
                    View All Events ({events.length - 10} more)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
              <p className="text-foreground-tertiary">No security events found</p>
              <p className="text-sm text-foreground-tertiary mt-1">
                Your security events will appear here as they occur
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Recommendations
          </CardTitle>
          <CardDescription>
            Suggestions to improve your account security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample recommendations - in real app these would be dynamic */}
            <div className="flex items-start space-x-3 p-3 bg-status-success/10 border border-status-success/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-status-success mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground-primary">
                  Biometric authentication enabled
                </p>
                <p className="text-xs text-foreground-tertiary">
                  Great! You have biometric authentication set up for enhanced security.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-status-info/10 border border-status-info/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-status-info mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground-primary">
                  Consider adding a backup authentication method
                </p>
                <p className="text-xs text-foreground-tertiary mb-2">
                  Add email or SMS backup for account recovery.
                </p>
                <Button size="sm" variant="secondary">
                  Set Up Backup
                </Button>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
              <Shield className="w-5 h-5 text-accent-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground-primary">
                  Review your trusted devices
                </p>
                <p className="text-xs text-foreground-tertiary mb-2">
                  You have {stats.activeDevices}/5 devices registered. Remove unused devices.
                </p>
                <Button size="sm" variant="secondary">
                  Manage Devices
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}