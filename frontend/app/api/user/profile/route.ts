import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/middleware'

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().min(10).optional()
})

// Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    
    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        osId: true,
        username: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        isVerified: true,
        kycStatus: true,
        createdAt: true,
        lastLoginAt: true
      }
    })
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ profile })
    
  } catch (error) {
    console.error('Get profile error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const body = await request.json()
    const updates = updateProfileSchema.parse(body)
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updates,
      select: {
        osId: true,
        username: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        isVerified: true,
        kycStatus: true
      }
    })
    
    // Log profile update
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      userId: user.userId,
      eventType: 'PROFILE_UPDATE',
      description: 'User profile updated',
      metadata: { updatedFields: Object.keys(updates) },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'LOW'
    })
    
    return NextResponse.json({
      success: true,
      profile: updatedUser
    })
    
  } catch (error) {
    console.error('Update profile error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}