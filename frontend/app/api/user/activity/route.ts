// app/api/user/activity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserFromRequest } from '@/lib/auth/middleware'
import { getSecurityLogs, getSecurityLogSummary } from '@/lib/db/security'
import { prisma } from '@/lib/db/prisma'

// Define the query parameters schema for filtering
const activityQuerySchema = z.object({
  eventType: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dateRange: z.string().optional(), // Number of days to look back
  searchTerm: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('20'),
  username: z.string().optional() // New parameter to filter by specific username
})

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const queryParams = {
      eventType: searchParams.get('eventType') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined,
      dateRange: searchParams.get('dateRange') || undefined,
      searchTerm: searchParams.get('searchTerm') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      username: searchParams.get('username') || undefined
    }
    
    // Validate the query parameters
    const { eventType, riskLevel, dateRange, searchTerm, page, limit, username } = activityQuerySchema.parse(queryParams)
    
    // Convert string parameters to appropriate types
    const pageNumber = parseInt(page)
    const limitNumber = parseInt(limit)
    const dateRangeNumber = dateRange ? parseInt(dateRange) : undefined

    // Check if we're filtering by username
    const isUsernameFilter = !!username
    
    // Get user info (optional for username filtering)
    const user = getUserFromRequest(request)
    
    let securityLogsResult
    let summary
    let targetUser = null

    if (isUsernameFilter) {
      // Find the user by username first
      targetUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true, osId: true, username: true }
      })

      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: `User with username '${username}' not found` },
          { status: 404 }
        )
      }

      console.log(`🔍 Fetching security logs for user: ${username} (${targetUser.osId})`)
      
      // Fetch logs for the specific user
      securityLogsResult = await getSecurityLogs({
        userId: targetUser.id,
        eventType,
        riskLevel: riskLevel as any,
        dateRange: dateRangeNumber,
        searchTerm,
        page: pageNumber,
        limit: limitNumber
      })

      // Get summary for the specific user
      summary = await getSecurityLogSummary(targetUser.id, dateRangeNumber || 30)
      
    } else {
      // Normal user-specific logs (requires authentication)
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required or specify username parameter' },
          { status: 401 }
        )
      }

      // Fetch security logs using our helper function for authenticated user
      securityLogsResult = await getSecurityLogs({
        userId: user.userId,
        eventType,
        riskLevel: riskLevel as any,
        dateRange: dateRangeNumber,
        searchTerm,
        page: pageNumber,
        limit: limitNumber
      })

      // Get summary statistics for the authenticated user
      summary = await getSecurityLogSummary(user.userId, dateRangeNumber || 30)
    }

    // Transform the data to match our frontend interface
    const transformedActivities = securityLogsResult.logs.map(log => ({
      id: log.id,
      eventType: log.eventType,
      description: log.description || `${log.eventType} event`,
      timestamp: log.createdAt.toISOString(),
      ipAddress: log.ipAddress || 'Unknown',
      deviceInfo: parseUserAgent(log.userAgent || 'Unknown Device'),
      location: extractLocationFromMetadata(log.metadata) || 'Unknown Location',
      riskLevel: log.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      success: !log.eventType.includes('FAILED') && !log.eventType.includes('ERROR'),
      metadata: log.metadata,
      // Include user info when filtering by username
      user: isUsernameFilter && targetUser ? {
        osId: targetUser.osId,
        username: targetUser.username
      } : (log.user ? {
        osId: log.user.osId,
        username: log.user.username
      } : undefined)
    }))

    return NextResponse.json({
      success: true,
      data: {
        activities: transformedActivities,
        pagination: securityLogsResult.pagination,
        summary,
        targetUser: isUsernameFilter ? {
          osId: targetUser?.osId,
          username: targetUser?.username
        } : undefined
      }
    })

  } catch (error) {
    console.error('Failed to fetch activity logs:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}

// Function to get ALL security logs (admin/testing mode)
async function getAllSecurityLogs(filters: {
  eventType?: string
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'ALL'
  dateRange?: number
  searchTerm?: string
  page: number
  limit: number
}) {
  try {
    const { eventType, riskLevel, dateRange, searchTerm, page, limit } = filters
    
    // Calculate pagination
    const skip = (page - 1) * limit

    // Build the where clause for filtering (similar to getSecurityLogs but without userId filter)
    const whereClause: any = {}

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

    // Filter by search term
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
          userId: true,
          // Include user info for all logs
          user: {
            select: {
              osId: true,
              username: true
            }
          }
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
    console.error('Failed to fetch all security logs:', error)
    throw new Error('Failed to fetch all security logs')
  }
}

// Function to get summary for all logs
async function getAllSecurityLogSummary(days: number = 30) {
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
          createdAt: { gte: startDate }
        }
      }),
      
      // Successful events
      prisma.securityLog.count({
        where: {
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
          createdAt: { gte: startDate },
          riskLevel: {
            in: ['HIGH', 'CRITICAL']
          }
        }
      }),
      
      // Events in the last 24 hours
      prisma.securityLog.count({
        where: {
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
    console.error('Failed to fetch all security log summary:', error)
    throw new Error('Failed to fetch all security log summary')
  }
}

// Function to get total users count
async function getTotalUsersCount(): Promise<number> {
  try {
    return await prisma.user.count()
  } catch (error) {
    console.error('Failed to get total users count:', error)
    return 0
  }
}

// Helper function to parse user agent into a readable device string
function parseUserAgent(userAgent: string): string {
  if (!userAgent || userAgent === 'Unknown Device') return 'Unknown Device'
  
  // Extract browser and OS information from user agent
  const browsers = {
    'Chrome': /Chrome\/[\d.]+/,
    'Firefox': /Firefox\/[\d.]+/,
    'Safari': /Safari\/[\d.]+/,
    'Edge': /Edge\/[\d.]+/,
    'Opera': /Opera\/[\d.]+/
  }
  
  const systems = {
    'Windows': /Windows NT/,
    'MacOS': /Macintosh|Mac OS X/,
    'iOS': /iPhone|iPad/,
    'Android': /Android/,
    'Linux': /Linux/
  }
  
  let browser = 'Unknown Browser'
  let system = 'Unknown OS'
  
  // Find browser
  for (const [name, regex] of Object.entries(browsers)) {
    if (regex.test(userAgent)) {
      browser = name
      break
    }
  }
  
  // Find operating system
  for (const [name, regex] of Object.entries(systems)) {
    if (regex.test(userAgent)) {
      system = name
      break
    }
  }
  
  return `${browser} on ${system}`
}

// Helper function to extract location from metadata
function extractLocationFromMetadata(metadata: any): string | null {
  if (!metadata) return null
  
  // Check if location is stored in metadata
  if (metadata.location) {
    return metadata.location
  }
  
  // Check if we have geographic data
  if (metadata.country && metadata.city) {
    return `${metadata.city}, ${metadata.country}`
  }
  
  if (metadata.country) {
    return metadata.country
  }
  
  // Check for state/region info
  if (metadata.region) {
    return metadata.region
  }
  
  return null
}