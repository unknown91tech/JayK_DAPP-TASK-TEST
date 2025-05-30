// app/api/auth/session/route.ts - Improved session endpoint
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
    console.log('🔧 Setup complete:', user.isSetupComplete)
    console.log('✅ Verified:', user.isVerified)
    
    // Always return user data, regardless of setup status
    // The client can decide what to do based on setup completion
    return NextResponse.json({
      authenticated: true,
      user: {
        osId: user.osId,
        username: user.username,
        isSetupComplete: user.isSetupComplete || false,
        isVerified: user.isVerified || false
      },
      // Include helpful metadata
      metadata: {
        tokenValid: true,
        needsSetup: !user.isSetupComplete,
        needsVerification: !user.isVerified
      }
    })
    
  } catch (error) {
    console.error('❌ Session verification failed:', error)
    
    // Return detailed error info for debugging in development
    const errorResponse = {
      authenticated: false,
      error: 'Invalid session token'
    }
    
    // In development, include more error details
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error = `Session verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
    
    return NextResponse.json(errorResponse, { status: 401 })
  }
}