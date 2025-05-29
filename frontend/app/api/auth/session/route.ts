// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Session check requested')
    
    // Get the session token from cookies
    const sessionToken = request.cookies.get('onestep-session')?.value
    
    console.log('🍪 Session token found:', !!sessionToken)
    
    if (!sessionToken) {
      return NextResponse.json({
        authenticated: false,
        error: 'No session token found'
      }, { status: 401 })
    }
    
    // Verify the JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key')
    const { payload } = await jwtVerify(sessionToken, secret)
    
    const user = payload as {
      userId: string
      osId: string
      username?: string
      isSetupComplete?: boolean
      isVerified?: boolean
    }
    
    console.log('✅ Session valid for user:', user.osId)
    
    return NextResponse.json({
      authenticated: true,
      user: {
        osId: user.osId,
        username: user.username,
        isSetupComplete: user.isSetupComplete,
        isVerified: user.isVerified
      }
    })
    
  } catch (error) {
    console.error('❌ Session verification failed:', error)
    
    return NextResponse.json({
      authenticated: false,
      error: 'Invalid session token'
    }, { status: 401 })
  }
}