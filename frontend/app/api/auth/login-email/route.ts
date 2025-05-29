import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'
import { isValidEmail } from '@/lib/services/email'
import { SignJWT } from 'jose'

const emailLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otpCode: z.string().length(6, 'OTP must be 6 digits')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otpCode } = emailLoginSchema.parse(body)
    
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const normalizedEmail = email.toLowerCase()
    
    // Verify OTP
    const { verifyOtp } = await import('@/lib/db/prisma')
    const otpResult = await verifyOtp(normalizedEmail, otpCode, 'LOGIN')
    
    if (!otpResult.success) {
      // Log failed login attempt
      await logSecurityEvent({
        eventType: 'LOGIN_FAILED',
        description: `Failed email login attempt for ${normalizedEmail}`,
        metadata: { email: normalizedEmail, reason: otpResult.error },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        riskLevel: 'MEDIUM'
      })
      
      return NextResponse.json(
        { error: otpResult.error },
        { status: 400 }
      )
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        socialLogins: true,
        devices: {
          where: { isActive: true }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      )
    }
    
    // Create JWT session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const sessionToken = await new SignJWT({
      userId: user.id,
      osId: user.osId,
      username: user.username,
      isSetupComplete: !!user.username && !!user.firstName
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret)
    
    // Log successful login
    await logSecurityEvent({
      userId: user.id,
      eventType: 'LOGIN_SUCCESS',
      description: 'Successful email login',
      metadata: { 
        email: normalizedEmail,
        loginMethod: 'email_otp',
        deviceCount: user.devices.length
      },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'LOW'
    })
    
    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
    
    const response = NextResponse.json({
      success: true,
      user: {
        osId: user.osId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSetupComplete: !!user.username && !!user.firstName
      }
    })
    
    // Set session cookie
    response.cookies.set('onestep-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })
    
    return response
    
  } catch (error) {
    console.error('Email login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}