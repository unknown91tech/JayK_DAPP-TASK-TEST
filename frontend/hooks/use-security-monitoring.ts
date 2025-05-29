
// hooks/use-security-monitoring.ts
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'

interface SecurityEvent {
  id: string
  eventType: string
  description: string
  timestamp: string
  ipAddress?: string
  deviceInfo?: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

interface SecurityStats {
  totalEvents: number
  recentAlerts: number
  riskScore: number
  activeDevices: number
}

/**
 * Hook for security monitoring and event tracking
 */
export function useSecurityMonitoring() {
  const { user } = useAuth()
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    recentAlerts: 0,
    riskScore: 0,
    activeDevices: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch security events
  useEffect(() => {
    const fetchSecurityData = async () => {
      if (!user) return

      try {
        const [eventsResponse, statsResponse] = await Promise.all([
          fetch('/api/security/events'),
          fetch('/api/security/stats')
        ])

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          setEvents(eventsData.events || [])
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch security data:', error)
        setLoading(false)
      }
    }

    fetchSecurityData()
  }, [user])

  // Log a security event
  const logSecurityEvent = async (event: {
    eventType: string
    description: string
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    metadata?: any
  }) => {
    try {
      await fetch('/api/security/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  // Get recent high-risk events
  const getHighRiskEvents = () => {
    return events.filter(event => 
      ['HIGH', 'CRITICAL'].includes(event.riskLevel) &&
      new Date(event.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    )
  }

  // Check if there are recent security alerts
  const hasRecentAlerts = () => {
    return getHighRiskEvents().length > 0
  }

  return {
    events,
    stats,
    loading,
    logSecurityEvent,
    getHighRiskEvents,
    hasRecentAlerts
  }
}