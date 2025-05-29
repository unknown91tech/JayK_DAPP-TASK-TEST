import { NextRequest, NextResponse } from 'next/server'
import { refreshSessionToken, extractToken } from '@/lib/auth/jwt'
import { logSecurityEvent } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    // Extract current session token
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    const currentToken = extractToken(authHeader, cookieHeader)
    
    if (!currentToken) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 401 }
      )
    }
    
    // Refresh the token
    const newToken = await refreshSessionToken(currentToken)
    
    // Log the refresh event
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      eventType: 'SESSION_REFRESH',
      description: 'Session token refreshed successfully',
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'LOW'
    })
    
    // Set new token in cookie and return response
    const response = NextResponse.json({
      success: true,
      message: 'Session refreshed successfully',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })
    
    response.cookies.set('onestep-session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })
    
    return response
    
  } catch (error) {
    console.error('Token refresh error:', error)
    
    return NextResponse.json(
      { error: 'Failed to refresh session' },
      { status: 401 }
    )
  }
}