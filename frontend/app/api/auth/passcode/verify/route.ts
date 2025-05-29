import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'
import { verifyHashedData } from '@/lib/utils/helpers'
import { SignJWT } from 'jose'

const verifyPasscodeSchema = z.object({
  passcode: z.string().length(6, 'Passcode must be 6 digits')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { passcode } = verifyPasscodeSchema.parse(body)
    
    // For login flow, we need to identify the user somehow
    // This could be from a pre-auth token or session
    const preAuthToken = request.headers.get('x-pre-auth') || 
                        request.cookies.get('onestep-pre-auth')?.value
    
    if (!preAuthToken) {
      return NextResponse.json(
        { error: 'Pre-authentication required' },
        { status: 401 }
      )
    }
    
    // In a real implementation, you'd verify the pre-auth token
    // For now, let's assume it contains the user ID
    
    // Find user (this would come from the pre-auth token)
    // For demo purposes, let's say we're looking up by the most recent login attempt
    const user = await prisma.user.findFirst({
      where: {
        passcodeHash: { not: null }
      },
      orderBy: {
        lastLoginAt: 'desc'
      }
    })
    
    if (!user || !user.passcodeHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Verify passcode
    const isValid = await verifyHashedData(passcode, user.passcodeHash)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    if (!isValid) {
      // Log failed login attempt
      await logSecurityEvent({
        userId: user.id,
        eventType: 'LOGIN_FAILED',
        description: 'Invalid passcode attempt',
        metadata: { loginMethod: 'passcode' },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        riskLevel: 'MEDIUM'
      })
      
      return NextResponse.json(
        { error: 'Invalid passcode' },
        { status: 401 }
      )
    }
    
    // Create full session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const sessionToken = await new SignJWT({
      userId: user.id,
      osId: user.osId,
      username: user.username,
      isSetupComplete: true
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret)
    
    // Log successful login
    await logSecurityEvent({
      userId: user.id,
      eventType: 'LOGIN_SUCCESS',
      description: 'Successful passcode login',
      metadata: { loginMethod: 'passcode' },
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
        username: user.username
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
    console.error('Passcode verification error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid passcode format' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}