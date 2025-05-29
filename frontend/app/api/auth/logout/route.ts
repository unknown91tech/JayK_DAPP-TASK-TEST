import { NextRequest, NextResponse } from 'next/server'
import { logSecurityEvent } from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  try {
    // Get user info if available (for logging purposes)
    const user = getUserFromRequest(request)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Log the logout event
    if (user) {
      await logSecurityEvent({
        userId: user.userId,
        eventType: 'LOGOUT',
        description: 'User logged out successfully',
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        riskLevel: 'LOW'
      })
    }
    
    // Create response that clears the session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
    // Clear the session cookie
    response.cookies.set('onestep-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })
    
    return response
    
  } catch (error) {
    console.error('Logout error:', error)
    
    // Even if logging fails, we should still clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
    response.cookies.set('onestep-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })
    
    return response
  }
}