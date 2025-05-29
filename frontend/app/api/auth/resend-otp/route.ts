import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { upsertOtpVerification, logSecurityEvent } from '@/lib/db/prisma'
import { generateOtp, formatPhoneNumber } from '@/lib/utils/helpers'
import { checkRateLimit } from '@/lib/auth/middleware'

const resendOtpSchema = z.object({
  identifier: z.string().min(1, 'Phone number or email is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier } = resendOtpSchema.parse(body)
    
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Rate limiting - max 3 OTP requests per 15 minutes per IP
    const rateLimit = checkRateLimit(clientIp, 3, 15 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please try again later.' },
        { status: 429 }
      )
    }
    
    // Generate new OTP
    const otpCode = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    // Store OTP in database
    await upsertOtpVerification({
      identifier: formatPhoneNumber(identifier),
      code: otpCode,
      purpose: 'LOGIN',
      expiresAt
    })
    
    // In a real app, send OTP via SMS or email
    // For demo purposes, we'll just log it
    console.log(`OTP for ${identifier}: ${otpCode}`)
    
    // Log the OTP resend event
    await logSecurityEvent({
      eventType: 'OTP_RESEND',
      description: `OTP resent to ${identifier}`,
      metadata: { identifier, attemptsRemaining: rateLimit.remaining },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'LOW'
    })
    
    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresAt: expiresAt.toISOString()
    })
    
  } catch (error) {
    console.error('Resend OTP error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to resend OTP' },
      { status: 500 }
    )
  }
}