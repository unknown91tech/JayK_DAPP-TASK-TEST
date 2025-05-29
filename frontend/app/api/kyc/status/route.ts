import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { findUserByOsId } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const authUser = requireAuth(request)
    
    const user = await findUserByOsId(authUser.osId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      kycStatus: user.kycStatus,
      submittedAt: user.kycData?.submittedAt,
      updatedAt: user.updatedAt
    })

  } catch (error) {
    console.error('KYC status error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch KYC status' },
      { status: 500 }
    )
  }
}