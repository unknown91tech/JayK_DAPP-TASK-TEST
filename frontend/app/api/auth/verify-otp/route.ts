import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, verifyOtp, logSecurityEvent } from '@/lib/db/prisma'
import { generateSessionToken } from '@/lib/utils/helpers'
import { SignJWT } from 'jose'

// Request validation schema
const verifyOtpSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  otp: z.string().length(6, 'OTP must be 6 digits')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, otp } = verifyOtpSchema.parse(body)
    
    // Get client IP for security logging
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown'
    
    // Verify the OTP
    const otpResult = await verifyOtp(identifier, otp, 'LOGIN')
    
    if (!otpResult.success) {
      // Log failed OTP verification
      await logSecurityEvent({
        eventType: 'LOGIN_FAILED',
        description: `Failed OTP verification for ${identifier}`,
        metadata: { reason: otpResult.error, identifier },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        riskLevel: 'MEDIUM'
      })
      
      return NextResponse.json(
        { error: otpResult.error },
        { status: 400 }
      )
    }
    
    // Find user by identifier (could be email or phone)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phoneNumber: identifier }
        ]
      },
      include: {
        socialLogins: true
      }
    })
    
    if (!user) {
      // This is a new user signup flow
      return NextResponse.json({
        success: true,
        isNewUser: true,
        message: 'OTP verified. Please complete account setup.',
        tempToken: generateSessionToken() // Temporary token for setup flow
      })
    }
    
    // Existing user login flow
    // Create JWT session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const sessionToken = await new SignJWT({
      userId: user.id,
      osId: user.osId,
      username: user.username,
      isSetupComplete: !!user.username // Check if setup is complete
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret)
    
    // Log successful login
    await logSecurityEvent({
      userId: user.id,
      eventType: 'LOGIN_SUCCESS',
      description: 'Successful OTP login',
      metadata: { loginMethod: 'otp', identifier },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'LOW'
    })
    
    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
    
    // Set session cookie and return success
    const response = NextResponse.json({
      success: true,
      isNewUser: false,
      user: {
        osId: user.osId,
        username: user.username,
        email: user.email
      }
    })
    
    response.cookies.set('onestep-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })
    
    return response
    
  } catch (error) {
    console.error('OTP verification error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}