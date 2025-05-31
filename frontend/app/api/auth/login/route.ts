// Example: app/api/auth/login/route.ts - Updated with security logging
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/db/prisma'
import { logSecurityEvent } from '@/lib/db/security'
import { checkRateLimit } from '@/lib/auth/middleware'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Phone number or email is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['LOGIN', 'SIGNUP']).default('LOGIN')
})

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined
  
  try {
    // Rate limiting - max 5 login attempts per 15 minutes per IP
    const rateLimit = checkRateLimit(clientIp, 5, 15 * 60 * 1000)
    if (!rateLimit.allowed) {
      // Log rate limit exceeded
      await logSecurityEvent({
        eventType: 'RATE_LIMIT_EXCEEDED',
        description: 'Login rate limit exceeded',
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'HIGH'
      })
      
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { identifier, otp, purpose } = loginSchema.parse(body)

    // Verify OTP (this is simplified - in real implementation, check database)
    const isValidOtp = await verifyOtp(identifier, otp, purpose)
    
    if (!isValidOtp) {
      // Log failed login attempt
      await logSecurityEvent({
        eventType: 'LOGIN_FAILED',
        description: 'Invalid OTP provided',
        metadata: { 
          identifier: identifier.substring(0, 4) + '***', // Partially mask for privacy
          reason: 'Invalid OTP',
          attempts: 6 - rateLimit.remaining 
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'MEDIUM'
      })
      
      return NextResponse.json(
        { success: false, error: 'Invalid OTP code' },
        { status: 401 }
      )
    }

    // Find or create user
    const user = await findOrCreateUser(identifier, purpose)
    
    if (!user) {
      await logSecurityEvent({
        eventType: 'LOGIN_FAILED',
        description: 'User not found or creation failed',
        metadata: { identifier: identifier.substring(0, 4) + '***' },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'MEDIUM'
      })
      
      return NextResponse.json(
        { success: false, error: 'Login failed' },
        { status: 401 }
      )
    }

    // Create JWT session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const sessionToken = await new SignJWT({
      userId: user.id,
      osId: user.osId,
      username: user.username,
      isSetupComplete: !!user.username && !!user.firstName,
      isVerified: user.isVerified
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret)

    // Log successful login
    await logSecurityEvent({
      userId: user.id,
      eventType: 'LOGIN_SUCCESS',
      description: `Successful ${purpose.toLowerCase()} via OTP`,
      metadata: { 
        loginMethod: 'otp',
        purpose,
        osId: user.osId,
        isNewUser: purpose === 'SIGNUP'
      },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'LOW'
    })

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Set session cookie and return success response
    const response = NextResponse.json({
      success: true,
      isNewUser: purpose === 'SIGNUP',
      user: {
        osId: user.osId,
        username: user.username,
        isSetupComplete: !!user.username && !!user.firstName,
        isVerified: user.isVerified
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
    console.error('Login error:', error)
    
    // Log system error
    await logSecurityEvent({
      eventType: 'SYSTEM_ERROR',
      description: 'Login system error',
      metadata: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/auth/login'
      },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'HIGH'
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}

// Helper function to verify OTP (simplified)
async function verifyOtp(identifier: string, otp: string, purpose: string): Promise<boolean> {
  try {
    // In development, accept any 6-digit OTP
    if (process.env.NODE_ENV === 'development') {
      return /^\d{6}$/.test(otp)
    }
    
    // In production, verify against database
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        identifier,
        code: otp,
        purpose,
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    })

    if (otpRecord) {
      // Mark OTP as used
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true, verifiedAt: new Date() }
      })
      return true
    }

    return false
  } catch (error) {
    console.error('OTP verification error:', error)
    return false
  }
}

// Helper function to find or create user
async function findOrCreateUser(identifier: string, purpose: string) {
  try {
    // For login, find existing user
    if (purpose === 'LOGIN') {
      return await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phoneNumber: identifier }
          ]
        }
      })
    }
    
    // For signup, create new user or return existing
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phoneNumber: identifier }
        ]
      }
    })

    if (existingUser) {
      return existingUser
    }

    // Create new user for signup
    const isEmail = identifier.includes('@')
    const osId = generateOsId()

    return await prisma.user.create({
      data: {
        osId,
        email: isEmail ? identifier : null,
        phoneNumber: isEmail ? null : identifier,
        isVerified: true // They've verified via OTP
      }
    })

  } catch (error) {
    console.error('User find/create error:', error)
    return null
  }
}

// Helper function to generate OS-ID
function generateOsId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'OS'
  
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}