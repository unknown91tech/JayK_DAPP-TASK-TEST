import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { findUserByOsId } from '@/lib/db/prisma'

// Get current user's OS-ID info
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    
    const userProfile = await findUserByOsId(user.osId)
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      osId: userProfile.osId,
      username: userProfile.username,
      createdAt: userProfile.createdAt,
      isVerified: userProfile.isVerified
    })
    
  } catch (error) {
    console.error('OS-ID fetch error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch OS-ID information' },
      { status: 500 }
    )
  }
}