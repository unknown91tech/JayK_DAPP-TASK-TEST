// app/api/auth/passcode/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'
import { verifyHashedData } from '@/lib/utils/helpers'
import { SignJWT } from 'jose'

// Schema for validating the passcode verification request
const verifyPasscodeSchema = z.object({
  passcode: z.string().length(6, 'Passcode must be 6 digits'),
  username: z.string().optional() // Username for identifying the user
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { passcode, username } = verifyPasscodeSchema.parse(body)
    
    // Get client info for security logging
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined
    
    // Check if this is a login flow (special header from frontend)
    const isLoginFlow = request.headers.get('x-login-flow') === 'true'
    console.log('🔑 Login flow detected:', isLoginFlow)
    
    // Method 1: Try to get username from request headers (sent by frontend)
    const usernameFromHeader = request.headers.get('x-username')
    
    // Method 2: Try to get username from pre-auth token
    const preAuthToken = request.headers.get('x-pre-auth')
    let usernameFromToken = null
    
    if (preAuthToken) {
      try {
        // Decode the pre-auth token sent by the frontend
        const tokenData = JSON.parse(atob(preAuthToken))
        usernameFromToken = tokenData.username
        console.log('📋 Username from pre-auth token:', usernameFromToken)
      } catch (error) {
        console.log('⚠️ Could not parse pre-auth token:', error)
      }
    }
    
    // Method 3: Check session cookies for existing user session (but don't require it for login)
    let usernameFromSession = null
    
    if (!isLoginFlow) {
      // Only check session if not in login flow to avoid conflicts
      const existingSessionToken = request.cookies.get('onestep-session')?.value
      
      if (existingSessionToken) {
        try {
          // Verify the session token to get user info
          const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key')
          const { jwtVerify } = await import('jose')
          const { payload } = await jwtVerify(existingSessionToken, secret)
          usernameFromSession = payload.username as string
          console.log('🍪 Username from session:', usernameFromSession)
        } catch (error) {
          console.log('⚠️ Could not verify session token:', error)
        }
      }
    }
    
    // Determine which username to use (priority: header > body > token > session)
    const finalUsername = usernameFromHeader || username || usernameFromToken || usernameFromSession
    
    if (!finalUsername) {
      console.log('❌ No username provided in any form')
      return NextResponse.json(
        { error: 'Username is required for passcode verification' },
        { status: 400 }
      )
    }
    
    console.log('👤 Using username for passcode verification:', finalUsername)
    
    // Find user by username in the database
    const user = await prisma.user.findUnique({
      where: { 
        username: finalUsername 
      },
      select: {
        id: true,
        osId: true,
        username: true,
        passcodeHash: true,
        isVerified: true,
        lastLoginAt: true,
        isSetupComplete: true // Include setup status
      }
    })
    
    // Check if user exists
    if (!user) {
      console.log('❌ User not found with username:', finalUsername)
      
      // Log failed login attempt (no user found)
      await logSecurityEvent({
        eventType: 'LOGIN_FAILED',
        description: `Passcode login failed - user not found: ${finalUsername}`,
        metadata: { 
          username: finalUsername,
          loginMethod: 'passcode',
          reason: 'user_not_found'
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'MEDIUM'
      })
      
      return NextResponse.json(
        { error: 'Invalid username or passcode' },
        { status: 401 }
      )
    }
    
    // Check if user has a passcode set up
    if (!user.passcodeHash) {
      console.log('❌ User has no passcode set up:', finalUsername)
      
      // Log failed login attempt (no passcode set)
      await logSecurityEvent({
        userId: user.id,
        eventType: 'LOGIN_FAILED',
        description: 'Passcode login failed - no passcode set up',
        metadata: { 
          username: finalUsername,
          loginMethod: 'passcode',
          reason: 'no_passcode_setup'
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'MEDIUM'
      })
      
      return NextResponse.json(
        { error: 'Passcode not set up for this account. Please complete account setup first.' },
        { status: 400 }
      )
    }
    
    // Check if user account is verified
    if (!user.isVerified) {
      console.log('❌ User account not verified:', finalUsername)
      
      await logSecurityEvent({
        userId: user.id,
        eventType: 'LOGIN_FAILED',
        description: 'Passcode login failed - account not verified',
        metadata: { 
          username: finalUsername,
          loginMethod: 'passcode',
          reason: 'account_not_verified'
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'MEDIUM'
      })
      
      return NextResponse.json(
        { error: 'Account not verified. Please complete verification first.' },
        { status: 403 }
      )
    }
    
    // Verify the passcode against the stored hash
    const isValidPasscode = await verifyHashedData(passcode, user.passcodeHash)
    
    if (!isValidPasscode) {
      console.log('❌ Invalid passcode for user:', finalUsername)
      
      // Log failed login attempt (invalid passcode)
      await logSecurityEvent({
        userId: user.id,
        eventType: 'LOGIN_FAILED',
        description: 'Invalid passcode attempt',
        metadata: { 
          username: finalUsername,
          loginMethod: 'passcode',
          reason: 'invalid_passcode'
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'HIGH' // Higher risk for wrong passcode
      })
      
      return NextResponse.json(
        { error: 'Invalid passcode. Please try again.' },
        { status: 401 }
      )
    }
    
    console.log('✅ Passcode verified successfully for user:', finalUsername)
    
    // Determine setup completion status
    // For login flow, we'll mark as complete since they have a working passcode
    const isSetupComplete = isLoginFlow ? true : (user.isSetupComplete || false)
    
    // Create a new session token for successful login
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const newSessionToken = await new SignJWT({
      userId: user.id,
      osId: user.osId,
      username: user.username,
      isSetupComplete: isSetupComplete, // Mark as complete for login flow
      isVerified: user.isVerified,
      loginMethod: 'passcode'
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d') // 7 days session duration
    .setIssuedAt()
    .setIssuer('onestep-auth') // Identify our auth system
    .setSubject(user.id) // User ID as subject
    .sign(secret)
    
    // Log successful login
    await logSecurityEvent({
      userId: user.id,
      eventType: 'LOGIN_SUCCESS',
      description: 'Successful passcode login',
      metadata: { 
        username: user.username,
        osId: user.osId,
        loginMethod: 'passcode',
        isLoginFlow: isLoginFlow
      },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'LOW' // Successful login is low risk
    })
    
    // Update user's last login time and setup status if this is a login flow
    const updateData: any = { lastLoginAt: new Date() }
    
    // If this is a login flow and user has passcode, mark setup as complete
    if (isLoginFlow && !user.isSetupComplete) {
      updateData.isSetupComplete = true
      console.log('🔧 Marking setup as complete for login flow user')
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    })
    
    // Prepare successful response
    const response = NextResponse.json({
      success: true,
      message: 'Passcode verified successfully',
      user: {
        osId: user.osId,
        username: user.username,
        isSetupComplete: isSetupComplete
      }
    })
    
    // Set the session cookie (HttpOnly for security)
    response.cookies.set('onestep-session', newSessionToken, {
      httpOnly: true, // Prevent JavaScript access for security
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/' // Available throughout the app
    })
    
    console.log('✅ Session token created and cookie set for user:', user.username)
    
    return response
    
  } catch (error) {
    console.error('❌ Passcode verification error:', error)
    
    // Log system error
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      eventType: 'SYSTEM_ERROR',
      description: 'Passcode verification system error',
      metadata: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/auth/passcode/verify'
      },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'HIGH' // System errors are high risk
    })
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format', 
          details: error.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      )
    }
    
    // Generic error response (don't leak internal details)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}