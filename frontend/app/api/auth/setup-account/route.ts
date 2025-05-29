import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, isUsernameAvailable, logSecurityEvent } from '@/lib/db/prisma'
import { generateOsId, formatPhoneNumber, validateUsername } from '@/lib/utils/helpers'
import { SignJWT } from 'jose'

const setupAccountSchema = z.object({
  username: z.string().min(6).max(20),
  dateOfBirth: z.string().min(1),
  phoneNumber: z.string().min(10),
  referralCode: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, dateOfBirth, phoneNumber, referralCode } = setupAccountSchema.parse(body)
    
    // Validate username
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.isValid) {
      return NextResponse.json(
        { error: usernameValidation.error },
        { status: 400 }
      )
    }
    
    // Check if username is available
    const isAvailable = await isUsernameAvailable(username)
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    // Check if phone number is already registered
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: formattedPhone }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number is already registered' },
        { status: 409 }
      )
    }
    
    // Generate unique OS-ID
    let osId: string
    let attempts = 0
    do {
      osId = generateOsId()
      attempts++
      // Prevent infinite loop
      if (attempts > 10) {
        throw new Error('Failed to generate unique OS-ID')
      }
    } while (await prisma.user.findUnique({ where: { osId } }))
    
    // Create user account
    const user = await prisma.user.create({
      data: {
        osId,
        username,
        phoneNumber: formattedPhone,
        dateOfBirth: new Date(dateOfBirth),
        isVerified: true, // Since they completed OTP verification
      }
    })
    
    // Log account creation
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      userId: user.id,
      eventType: 'ACCOUNT_CREATED',
      description: 'New account created successfully',
      metadata: { username, osId, referralCode },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'LOW'
    })
    
    // Create session token for setup flow
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const sessionToken = await new SignJWT({
      userId: user.id,
      osId: user.osId,
      username: user.username,
      isSetupComplete: false // Still need to complete passcode and biometric setup
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d') // Shorter expiry for setup flow
    .setIssuedAt()
    .sign(secret)
    
    const response = NextResponse.json({
      success: true,
      user: {
        osId: user.osId,
        username: user.username,
        phoneNumber: user.phoneNumber
      },
      message: 'Account created successfully'
    })
    
    response.cookies.set('onestep-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 1 day for setup flow
    })
    
    return response
    
  } catch (error) {
    console.error('Account setup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}