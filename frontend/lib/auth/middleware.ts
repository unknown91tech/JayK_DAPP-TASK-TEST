/**
 * Authentication middleware helpers for API routes and pages
 * These functions help protect routes and validate user sessions
 */

import { NextRequest } from 'next/server'

/**
 * Extract user information from request headers (set by middleware)
 */
export function getUserFromRequest(request: NextRequest): {
  userId: string
  osId: string
  username?: string
} | null {
  const userId = request.headers.get('x-user-id')
  const osId = request.headers.get('x-os-id')
  const username = request.headers.get('x-username')
  
  if (!userId || !osId) {
    return null
  }
  
  return {
    userId,
    osId,
    username: username || undefined
  }
}

/**
 * Require authentication for API routes
 * Returns user data or throws an error if not authenticated
 */
export function requireAuth(request: NextRequest): {
  userId: string
  osId: string
  username?: string
} {
  const user = getUserFromRequest(request)
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Check if user has completed setup
 */
export async function requireSetupComplete(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie')
  
  const token = extractToken(authHeader, cookieHeader)
  if (!token) {
    return false
  }
  
  try {
    const payload = await verifySessionToken(token)
    return payload.isSetupComplete
  } catch {
    return false
  }
}

/**
 * Rate limiting helper
 * Tracks requests per IP address to prevent abuse
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  ip: string, 
  maxRequests: number = 10, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    // First request or window expired
    const newRecord = { count: 1, resetTime: now + windowMs }
    rateLimitMap.set(ip, newRecord)
    return { allowed: true, remaining: maxRequests - 1, resetTime: newRecord.resetTime }
  }
  
  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  // Increment count
  record.count++
  rateLimitMap.set(ip, record)
  
  return { 
    allowed: true, 
    remaining: maxRequests - record.count, 
    resetTime: record.resetTime 
  }
}

/**
 * Clean up expired rate limit records (should be called periodically)
 */
export function cleanupRateLimit(): void {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}

/**
 * Security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; style-src 'self' 'unsafe-inline';"
  }
}

/**
 * Log security events for monitoring
 */
export async function logSecurityEvent(event: {
  userId?: string
  eventType: string
  description?: string
  ipAddress?: string
  userAgent?: string
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  metadata?: any
}): Promise<void> {
  try {
    // In a real application, you might send this to a security monitoring service
    // like Sentry, DataDog, or a custom logging system
    console.log('Security Event:', JSON.stringify(event, null, 2))
    
    // Store in database for audit trail
    await fetch('/api/security/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Validate request origin for CSRF protection
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  if (!origin && !referer) {
    // No origin/referer headers - could be suspicious
    return false
  }
  
  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`, // For development
    process.env.NEXTAUTH_URL
  ].filter(Boolean)
  
  if (origin && allowedOrigins.includes(origin)) {
    return true
  }
  
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      return allowedOrigins.some(allowed => {
        if (!allowed) return false
        const allowedUrl = new URL(allowed)
        return refererUrl.origin === allowedUrl.origin
      })
    } catch {
      return false
    }
  }
  
  return false
}