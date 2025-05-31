// lib/db/security.ts
import { prisma } from './prisma'

// Type definitions for security events
export interface SecurityEventData {
  userId?: string
  eventType: string
  description?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  deviceId?: string
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'ALL'
}

// Interface for fetching security logs with filters
export interface SecurityLogFilters {
  userId?: string
  eventType?: string
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'ALL'
  dateRange?: number // days to look back
  searchTerm?: string
  page?: number
  limit?: number
}

/**
 * Log a security event to the database
 * This function is used throughout the app to track security-related activities
 */
export async function logSecurityEvent(eventData: SecurityEventData): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        userId: eventData.userId || null,
        eventType: eventData.eventType,
        description: eventData.description || null,
        metadata: eventData.metadata || null,
        ipAddress: eventData.ipAddress || null,
        userAgent: eventData.userAgent || null,
        deviceId: eventData.deviceId || null,
        riskLevel: eventData.riskLevel || 'LOW'
      }
    })
    
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🛡️ Security Event Logged:', {
        eventType: eventData.eventType,
        userId: eventData.userId,
        riskLevel: eventData.riskLevel
      })
    }
    
  } catch (error) {
    console.error('Failed to log security event:', error)
    // Don't throw here - we don't want security logging to break the main flow
  }
}

/**
 * Fetch security logs with filtering and pagination
 * Used by the activity logs API endpoint
 */
export async function getSecurityLogs(filters: SecurityLogFilters = {}) {
  try {
    const {
      userId,
      eventType,
      riskLevel,
      dateRange,
      searchTerm,
      page = 1,
      limit = 50
    } = filters

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build the where clause for filtering
    const whereClause: any = {}

    // Filter by user ID (required for user-specific logs)
    if (userId) {
      whereClause.userId = userId
    }

    // Filter by event type
    if (eventType && eventType !== 'all') {
      whereClause.eventType = eventType
    }

    // Filter by risk level
    if (riskLevel && riskLevel !== 'ALL') {
      whereClause.riskLevel = riskLevel
    }

    // Filter by date range
    if (dateRange && dateRange > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - dateRange)
      
      whereClause.createdAt = {
        gte: cutoffDate
      }
    }

    // Filter by search term (search in description, IP address, or user agent)
    if (searchTerm && searchTerm.trim()) {
      whereClause.OR = [
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          ipAddress: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          userAgent: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Fetch the logs and total count in parallel
    const [logs, totalCount] = await Promise.all([
      prisma.securityLog.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
        select: {
          id: true,
          eventType: true,
          description: true,
          createdAt: true,
          ipAddress: true,
          userAgent: true,
          deviceId: true,
          riskLevel: true,
          metadata: true,
          // Include user info if needed
          user: userId ? {
            select: {
              osId: true,
              username: true
            }
          } : false
        }
      }),
      prisma.securityLog.count({
        where: whereClause
      })
    ])

    return {
      logs,
      totalCount,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }

  } catch (error) {
    console.error('Failed to fetch security logs:', error)
    throw new Error('Failed to fetch security logs')
  }
}

/**
 * Get security event statistics for a user
 * Used for the dashboard summary cards
 */
export async function getSecurityLogSummary(userId: string, days: number = 30) {
  try {
    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get counts for different event types and risk levels
    const [
      totalEvents,
      successfulEvents,
      failedEvents,
      highRiskEvents,
      recent24hEvents
    ] = await Promise.all([
      // Total events in the specified period
      prisma.securityLog.count({
        where: {
          userId,
          createdAt: { gte: startDate }
        }
      }),
      
      // Successful events (events that don't contain "FAILED" or "ERROR")
      prisma.securityLog.count({
        where: {
          userId,
          createdAt: { gte: startDate },
          eventType: {
            not: {
              contains: 'FAILED'
            }
          }
        }
      }),
      
      // Failed events
      prisma.securityLog.count({
        where: {
          userId,
          createdAt: { gte: startDate },
          OR: [
            { eventType: { contains: 'FAILED' } },
            { eventType: { contains: 'ERROR' } }
          ]
        }
      }),
      
      // High risk events
      prisma.securityLog.count({
        where: {
          userId,
          createdAt: { gte: startDate },
          riskLevel: {
            in: ['HIGH', 'CRITICAL']
          }
        }
      }),
      
      // Events in the last 24 hours
      prisma.securityLog.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return {
      total: totalEvents,
      successful: successfulEvents,
      failed: failedEvents,
      highRisk: highRiskEvents,
      recent24h: recent24hEvents
    }

  } catch (error) {
    console.error('Failed to fetch security log summary:', error)
    throw new Error('Failed to fetch security log summary')
  }
}

/**
 * Get recent security events for a user (for dashboard widgets)
 */
export async function getRecentSecurityEvents(userId: string, limit: number = 5) {
  try {
    const recentEvents = await prisma.securityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        description: true,
        createdAt: true,
        riskLevel: true,
        ipAddress: true
      }
    })

    return recentEvents

  } catch (error) {
    console.error('Failed to fetch recent security events:', error)
    throw new Error('Failed to fetch recent security events')
  }
}

/**
 * Check for suspicious activity patterns
 * This can be used for real-time security monitoring
 */
export async function detectSuspiciousActivity(userId: string) {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Check for multiple failed login attempts
    const failedLogins = await prisma.securityLog.count({
      where: {
        userId,
        eventType: 'LOGIN_FAILED',
        createdAt: { gte: last24Hours }
      }
    })

    // Check for logins from different locations
    const uniqueIPs = await prisma.securityLog.findMany({
      where: {
        userId,
        eventType: 'LOGIN_SUCCESS',
        createdAt: { gte: last24Hours }
      },
      select: { ipAddress: true },
      distinct: ['ipAddress']
    })

    // Check for high-risk events
    const highRiskEvents = await prisma.securityLog.count({
      where: {
        userId,
        riskLevel: { in: ['HIGH', 'CRITICAL'] },
        createdAt: { gte: last24Hours }
      }
    })

    // Define suspicious activity thresholds
    const suspiciousActivity = {
      multipleFailedLogins: failedLogins >= 5,
      multipleLocations: uniqueIPs.length >= 3,
      highRiskActivity: highRiskEvents >= 2,
      overall: false
    }

    // Overall suspicious if any condition is met
    suspiciousActivity.overall = Object.values(suspiciousActivity).some(Boolean)

    return suspiciousActivity

  } catch (error) {
    console.error('Failed to detect suspicious activity:', error)
    return {
      multipleFailedLogins: false,
      multipleLocations: false,
      highRiskActivity: false,
      overall: false
    }
  }
}

/**
 * Clean up old security logs (for maintenance)
 * This should be run periodically to prevent the security_logs table from growing too large
 */
export async function cleanupOldSecurityLogs(retentionDays: number = 365) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const deletedCount = await prisma.securityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    })

    console.log(`Cleaned up ${deletedCount.count} old security logs`)
    return deletedCount.count

  } catch (error) {
    console.error('Failed to cleanup old security logs:', error)
    throw new Error('Failed to cleanup old security logs')
  }
}