// app/api/user/biometrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// GET endpoint to fetch user's biometric credentials
export async function GET(request: NextRequest) {
  try {
    console.log('📱 Fetching user biometric credentials...')
    
    // Get client information for logging
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Try multiple ways to get the user identifier
    let userId: string | null = null
    let username: string | null = null
    let osId: string | null = null
    
    // Method 1: Try requireAuth first
    try {
      const authUser = requireAuth(request)
      userId = authUser.userId
      console.log('✅ Got user from requireAuth:', userId)
    } catch (error) {
      console.log('ℹ️ requireAuth failed, trying alternative methods...')
    }
    
    // Method 2: Check for user identifiers in query params or headers
    if (!userId) {
      const { searchParams } = new URL(request.url)
      username = searchParams.get('username')
      osId = searchParams.get('osId')
      
      // Also check headers (in case frontend sends them)
      if (!username) username = request.headers.get('x-username')
      if (!osId) osId = request.headers.get('x-os-id')
      
      console.log('🔍 Looking for user by username:', username, 'or osId:', osId)
    }
    
    // Method 3: If still no user info, return error
    if (!userId && !username && !osId) {
      console.log('❌ No user identifier found')
      
      await logSecurityEvent({
        eventType: 'BIOMETRIC_FETCH_NO_AUTH',
        description: 'Attempted to fetch biometrics without authentication',
        metadata: { 
          hasAuth: false,
          hasUsername: false,
          hasOsId: false
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'MEDIUM'
      })
      
      return NextResponse.json(
        { error: 'Authentication required. Please provide username, osId, or valid session.' },
        { status: 401 }
      )
    }
    
    // Find the user in the database using available identifiers
    let user
    if (userId) {
      // Use the authenticated user ID
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          biometrics: {
            where: { isActive: true }, // Only get active biometrics
            orderBy: { createdAt: 'desc' }, // Most recent first
            select: {
              id: true,
              credentialId: true,
              deviceType: true,
              createdAt: true,
              lastUsedAt: true,
              isActive: true,
              // Don't expose sensitive data like publicKey
            }
          }
        }
      })
    } else if (osId) {
      // Look up user by OS-ID
      user = await prisma.user.findUnique({
        where: { osId: osId },
        include: {
          biometrics: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              credentialId: true,
              deviceType: true,
              createdAt: true,
              lastUsedAt: true,
              isActive: true,
            }
          }
        }
      })
    } else if (username) {
      // Look up user by username
      user = await prisma.user.findUnique({
        where: { username: username },
        include: {
          biometrics: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              credentialId: true,
              deviceType: true,
              createdAt: true,
              lastUsedAt: true,
              isActive: true,
            }
          }
        }
      })
    }
    
    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Found user: ${user.osId} (${user.username}) with ${user.biometrics.length} active biometrics`)
    
    // Log the biometric access for security audit
    await logSecurityEvent({
      userId: user.id,
      eventType: 'BIOMETRIC_LIST_ACCESSED',
      description: 'User accessed their biometric credentials list',
      metadata: { 
        biometricCount: user.biometrics.length,
        userAgent: userAgent.substring(0, 200) // Truncate for storage
      },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'LOW'
    })
    
    // Format biometric data with friendly names
    const formattedBiometrics = user.biometrics.map(biometric => {
      // Generate friendly device name based on device type
      const getDeviceName = (deviceType: string) => {
        switch (deviceType) {
          case 'touch': return 'Touch ID'
          case 'face': return 'Face ID'
          case 'fingerprint': return 'Fingerprint'
          default: return 'Biometric Device'
        }
      }
      
      // Calculate days since registration
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - new Date(biometric.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Calculate days since last use
      const daysSinceLastUse = biometric.lastUsedAt 
        ? Math.floor((new Date().getTime() - new Date(biometric.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null
      
      return {
        id: biometric.id,
        credentialId: biometric.credentialId,
        deviceName: getDeviceName(biometric.deviceType),
        deviceType: biometric.deviceType,
        createdAt: biometric.createdAt,
        lastUsedAt: biometric.lastUsedAt,
        isActive: biometric.isActive,
        daysSinceCreated,
        daysSinceLastUse,
        status: biometric.lastUsedAt ? 'used' : 'registered'
      }
    })
    
    // Check if user has reached the maximum limit
    const maxBiometrics = 3
    const canAddMore = user.biometrics.length < maxBiometrics
    
    // Return the user's biometric information
    return NextResponse.json({
      success: true,
      user: {
        osId: user.osId,
        username: user.username,
        isSetupComplete: user.isSetupComplete
      },
      biometrics: formattedBiometrics,
      summary: {
        totalActive: user.biometrics.length,
        maxAllowed: maxBiometrics,
        canAddMore,
        hasAnyBiometrics: user.biometrics.length > 0,
        mostRecentlyUsed: user.biometrics
          .filter(b => b.lastUsedAt)
          .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())[0]?.lastUsedAt || null
      }
    })
    
  } catch (error) {
    console.error('❌ Error fetching biometric credentials:', error)
    
    // Log the error for monitoring
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    try {
      await logSecurityEvent({
        eventType: 'BIOMETRIC_FETCH_ERROR',
        description: 'Error occurred while fetching biometric credentials',
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'MEDIUM'
      })
    } catch (logError) {
      console.error('Failed to log security event:', logError)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch biometric credentials',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error'
          : 'Please try again later'
      },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove a specific biometric credential
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Processing biometric credential deletion...')
    
    const { searchParams } = new URL(request.url)
    const biometricId = searchParams.get('id')
    const username = searchParams.get('username')
    const osId = searchParams.get('osId')
    
    if (!biometricId) {
      return NextResponse.json(
        { error: 'Biometric ID is required' },
        { status: 400 }
      )
    }
    
    // Get client information
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Try to get authenticated user, fall back to username/osId lookup
    let userId: string | null = null
    
    try {
      const authUser = requireAuth(request)
      userId = authUser.userId
    } catch (error) {
      console.log('ℹ️ No authenticated session, using username/osId lookup')
      
      if (!username && !osId) {
        return NextResponse.json(
          { error: 'Authentication required or user identifier must be provided' },
          { status: 401 }
        )
      }
    }
    
    // Find the biometric credential and verify ownership
    let whereClause: any = {
      id: biometricId,
      isActive: true
    }
    
    // Add user filter based on available identifier
    if (userId) {
      whereClause.userId = userId
    } else {
      // We need to find the user first, then check ownership
      let user
      if (osId) {
        user = await prisma.user.findUnique({ where: { osId } })
      } else if (username) {
        user = await prisma.user.findUnique({ where: { username } })
      }
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      whereClause.userId = user.id
      userId = user.id // Set for logging
    }
    
    const biometric = await prisma.biometric.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            osId: true,
            username: true,
            biometrics: {
              where: { isActive: true }
            }
          }
        }
      }
    })
    
    if (!biometric) {
      console.log('❌ Biometric credential not found or not owned by user')
      return NextResponse.json(
        { error: 'Biometric credential not found' },
        { status: 404 }
      )
    }
    
    // Prevent deletion if it's the user's only biometric and they don't have other auth methods
    const activeBiometrics = biometric.user.biometrics.length
    if (activeBiometrics === 1) {
      // In a real app, you'd check if they have other auth methods like passcode
      console.log('⚠️ Warning: User attempting to delete last biometric credential')
      
      // You might want to require passcode confirmation here
      // For now, we'll allow it but log it as a security event
      await logSecurityEvent({
        userId: userId!,
        eventType: 'BIOMETRIC_DELETE_LAST',
        description: 'User deleted their last biometric credential',
        metadata: { 
          biometricId: biometric.id,
          deviceType: biometric.deviceType,
          credentialId: biometric.credentialId
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'HIGH'
      })
    }
    
    // Soft delete the biometric credential (mark as inactive)
    await prisma.biometric.update({
      where: { id: biometricId },
      data: { 
        isActive: false,
        // You might want to keep the credential for audit purposes
        // but mark it as deleted
      }
    })
    
    console.log(`✅ Biometric credential ${biometricId} marked as inactive`)
    
    // Log the deletion
    await logSecurityEvent({
      userId: userId!,
      eventType: 'BIOMETRIC_DELETED',
      description: `${biometric.deviceType} biometric credential removed`,
      metadata: { 
        biometricId: biometric.id,
        deviceType: biometric.deviceType,
        credentialId: biometric.credentialId,
        remainingBiometrics: activeBiometrics - 1
      },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'MEDIUM'
    })
    
    return NextResponse.json({
      success: true,
      message: 'Biometric credential removed successfully',
      remainingBiometrics: activeBiometrics - 1
    })
    
  } catch (error) {
    console.error('❌ Error deleting biometric credential:', error)
    
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete biometric credential',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error'
          : 'Please try again later'
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed - use GET to fetch biometrics or DELETE to remove them' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed - use GET to fetch biometrics or DELETE to remove them' },
    { status: 405 }
  )
}