// lib/auth/middleware.ts
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { logSecurityEvent } from '@/lib/db/security'

// Interface for authenticated user data
interface AuthenticatedUser {
  userId: string
  osId: string
  username?: string
  isSetupComplete?: boolean
  isVerified?: boolean
}

// Interface for JWT payload
interface JWTPayload {
  userId: string
  osId: string
  username?: string
  isSetupComplete?: boolean
  isVerified?: boolean
  iat?: number
  exp?: number
}

/**
 * Extract user information from request headers or JWT token
 * This is used by API routes that need user context
 */
export function getUserFromRequest(request: NextRequest): AuthenticatedUser | null {
  try {
    // Try to get user info from headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    const osId = request.headers.get('x-os-id')
    const username = request.headers.get('x-username')
    
    if (userId && osId) {
      return {
        userId,
        osId,
        username: username || undefined,
        isSetupComplete: request.headers.get('x-setup-complete') === 'true',
        isVerified: request.headers.get('x-verified') === 'true'
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to get user from request:', error)
    return null
  }
}

/**
 * Require authentication for protected API routes
 * Throws an error if user is not authenticated
 */
export function requireAuth(request: NextRequest): AuthenticatedUser {
  const user = getUserFromRequest(request)
  
  if (!user) {
    // Log failed authentication attempt
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined
    
    // Don't await this - we don't want to slow down the response
    logSecurityEvent({
      eventType: 'AUTH_REQUIRED_FAILED',
      description: 'Unauthorized API access attempt',
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'MEDIUM'
    }).catch(err => console.error('Failed to log security event:', err))
    
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Verify JWT token and return user data
 * Used by middleware and auth checking functions
 */
export async function verifyJWTToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key')
    const { payload } = await jwtVerify(token, secret)
    
    const jwtPayload = payload as unknown as JWTPayload
    
    // Ensure required fields exist
    if (!jwtPayload.userId || !jwtPayload.osId) {
      console.error('Invalid JWT payload: missing required fields')
      return null
    }
    
    return {
      userId: jwtPayload.userId,
      osId: jwtPayload.osId,
      username: jwtPayload.username,
      isSetupComplete: jwtPayload.isSetupComplete,
      isVerified: jwtPayload.isVerified
    }
    
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Extract JWT token from request headers or cookies
 */
export function extractToken(authHeader: string | null, cookieHeader: string | null): string | null {
  // First try to get token from Authorization header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Then try to get token from cookies
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    
    return cookies['onestep-session'] || null
  }
  
  return null
}

/**
 * Rate limiting helper
 * Simple in-memory rate limiting (in production, use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number, 
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const current = rateLimitStore.get(identifier)
  
  // If no record exists or window has expired, create new entry
  if (!current || now > current.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs
    }
  }
  
  // If within limit, increment count
  if (current.count < maxRequests) {
    current.count++
    rateLimitStore.set(identifier, current)
    
    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime
    }
  }
  
  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: current.resetTime
  }
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically
 */
export function cleanupRateLimit() {
  const now = Date.now()
  
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Log successful authentication
 */
export async function logSuccessfulAuth(
  userId: string,
  method: string,
  request: NextRequest
) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined
  
  try {
    await logSecurityEvent({
      userId,
      eventType: 'AUTH_SUCCESS',
      description: `Successful authentication via ${method}`,
      metadata: { authMethod: method },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'LOW'
    })
  } catch (error) {
    console.error('Failed to log successful auth:', error)
  }
}

/**
 * Log failed authentication
 */
export async function logFailedAuth(
  reason: string,
  method: string,
  request: NextRequest,
  userId?: string
) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined
  
  try {
    await logSecurityEvent({
      userId,
      eventType: 'AUTH_FAILED',
      description: `Authentication failed: ${reason}`,
      metadata: { authMethod: method, reason },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'MEDIUM'
    })
  } catch (error) {
    console.error('Failed to log failed auth:', error)
  }
}

/**
 * Check if user has required permissions
 * For future use when implementing role-based access control
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  // For now, all authenticated users have basic permissions
  // In the future, this would check user roles and permissions
  
  switch (permission) {
    case 'view_profile':
    case 'update_profile':
    case 'view_activity':
    case 'manage_devices':
      return true
    
    case 'admin_access':
    case 'manage_users':
      return false // Reserved for admin users
    
    default:
      return false
  }
}

/**
 * Validate session and check for suspicious activity
 */
export async function validateSession(
  user: AuthenticatedUser, 
  request: NextRequest
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Basic validation - user exists and has required fields
    if (!user.userId || !user.osId) {
      return { valid: false, reason: 'Invalid user session' }
    }
    
    // Check for setup completion if required
    const path = request.nextUrl.pathname
    const requiresSetup = ['/dashboard', '/api/user'].some(route => path.startsWith(route))
    
    if (requiresSetup && !user.isSetupComplete) {
      return { valid: false, reason: 'Account setup incomplete' }
    }
    
    // In production, you might check:
    // - If IP address has changed drastically
    // - If too many sessions are active
    // - If account is locked/suspended
    // - If device is trusted
    
    return { valid: true }
    
  } catch (error) {
    console.error('Session validation error:', error)
    return { valid: false, reason: 'Session validation failed' }
  }
}

/**
 * Generate device fingerprint for security tracking
 */
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  // In production, this would use more sophisticated fingerprinting
  // For now, we'll create a simple hash based on user agent and IP
  
  const crypto = require('crypto')
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}-${ip}-${Date.now()}`)
    .digest('hex')
    .substring(0, 16)
  
  return fingerprint
}