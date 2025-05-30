// app/api/auth/webauthn/get-challenge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'

// In-memory store for challenges (in production, use Redis or database)
const challengesDb: Record<string, { challenge: string, timestamp: number }> = {}

// Request validation schema
const getChallengeSchema = z.object({
  type: z.enum(['login', 'register']),
  method: z.enum(['touch', 'face']),
  username: z.string().optional(), // Username from database
  osId: z.string().optional(), // OS-ID for user identification
  telegramUserId: z.number().optional() // Fallback identifier
})

// Base64 URL encoding utility (needed for WebAuthn)
const bufferToBase64url = (buffer: Buffer): string => {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 WebAuthn: Generating authentication challenge...')
    
    // Parse and validate request
    const body = await request.json()
    const { type, method, username, osId, telegramUserId } = getChallengeSchema.parse(body)
    
    console.log('📋 Challenge request:', { type, method, username, osId })
    
    let user = null
    let userIdentifier = username || osId || `telegram_${telegramUserId}`
    
    // Try to find the user in database to get their biometric credentials
    if (osId) {
      // Look up user by OS-ID (most reliable)
      user = await prisma.user.findUnique({
        where: { osId },
        include: {
          biometrics: {
            where: { isActive: true },
            orderBy: { lastUsedAt: 'desc' }
          }
        }
      })
      console.log('🔍 Found user by OS-ID:', !!user)
    } else if (username) {
      // Look up user by username
      user = await prisma.user.findUnique({
        where: { username },
        include: {
          biometrics: {
            where: { isActive: true },
            orderBy: { lastUsedAt: 'desc' }
          }
        }
      })
      console.log('🔍 Found user by username:', !!user)
    } else if (telegramUserId) {
      // Look up user by Telegram ID (via social login)
      user = await prisma.user.findFirst({
        where: {
          socialLogins: {
            some: {
              provider: 'telegram',
              providerId: telegramUserId.toString()
            }
          }
        },
        include: {
          biometrics: {
            where: { isActive: true },
            orderBy: { lastUsedAt: 'desc' }
          }
        }
      })
      console.log('🔍 Found user by Telegram ID:', !!user)
    }
    
    // For login, we need an existing user with biometric credentials
    if (type === 'login' && !user) {
      console.log('❌ No user found for login attempt')
      return NextResponse.json(
        { error: 'User not found. Please ensure you have registered biometrics.' },
        { status: 404 }
      )
    }
    
    // If user found, update the identifier to use their actual username
    if (user) {
      userIdentifier = user.username || user.osId
      console.log('✅ Using user identifier:', userIdentifier)
    }
    
    // Generate a cryptographically secure challenge
    const challenge = bufferToBase64url(randomBytes(32))
    console.log('🔑 Generated challenge for user:', userIdentifier)
    
    // Store the challenge temporarily (expires in 5 minutes)
    const challengeKey = user?.id || userIdentifier
    challengesDb[challengeKey] = {
      challenge,
      timestamp: Date.now()
    }
    
    // Clean up old challenges (remove entries older than 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    Object.keys(challengesDb).forEach(key => {
      if (challengesDb[key].timestamp < fiveMinutesAgo) {
        delete challengesDb[key]
        console.log('🧹 Cleaned up expired challenge for:', key)
      }
    })
    
    // Prepare response data
    const responseData: any = {
      challenge,
      userId: bufferToBase64url(Buffer.from(userIdentifier)),
      userDisplayName: user?.firstName || user?.username || 'OneStep User'
    }
    
    // For login attempts, include credential information if available
    if (type === 'login' && user?.biometrics && user.biometrics.length > 0) {
      // Find the most recent biometric credential for the requested method
      const biometric = user.biometrics.find(b => 
        b.deviceType === method || 
        (method === 'touch' && b.deviceType === 'fingerprint') ||
        (method === 'face' && b.deviceType === 'face')
      ) || user.biometrics[0] // Fallback to most recent if no method match
      
      if (biometric) {
        responseData.credentialId = biometric.credentialId
        responseData.allowCredentials = [{
          id: biometric.credentialId,
          type: 'public-key',
          transports: method === 'touch' ? ['internal'] : ['internal', 'hybrid']
        }]
        console.log('🔒 Including credential ID for existing user')
      }
    }
    
    // For registration, we don't include credential info
    if (type === 'register') {
      responseData.excludeCredentials = user?.biometrics?.map(b => ({
        id: b.credentialId,
        type: 'public-key'
      })) || []
      console.log('📝 Registration challenge - excluding existing credentials')
    }
    
    console.log('✅ Challenge generated successfully')
    
    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('❌ Error generating WebAuthn challenge:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate authentication challenge' },
      { status: 500 }
    )
  }
}

// GET method to check if user has biometric credentials
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const osId = searchParams.get('osId')
    const telegramUserId = searchParams.get('telegramUserId')
    
    if (!username && !osId && !telegramUserId) {
      return NextResponse.json(
        { error: 'User identifier required' },
        { status: 400 }
      )
    }
    
    let user = null
    
    // Look up user
    if (osId) {
      user = await prisma.user.findUnique({
        where: { osId },
        include: {
          biometrics: {
            where: { isActive: true }
          }
        }
      })
    } else if (username) {
      user = await prisma.user.findUnique({
        where: { username },
        include: {
          biometrics: {
            where: { isActive: true }
          }
        }
      })
    } else if (telegramUserId) {
      user = await prisma.user.findFirst({
        where: {
          socialLogins: {
            some: {
              provider: 'telegram',
              providerId: telegramUserId
            }
          }
        },
        include: {
          biometrics: {
            where: { isActive: true }
          }
        }
      })
    }
    
    if (!user) {
      return NextResponse.json(
        { hasBiometrics: false, message: 'User not found' },
        { status: 404 }
      )
    }
    
    const hasBiometrics = user.biometrics.length > 0
    const biometricTypes = user.biometrics.map(b => b.deviceType)
    
    return NextResponse.json({
      hasBiometrics,
      biometricTypes,
      biometricCount: user.biometrics.length,
      username: user.username,
      osId: user.osId
    })
    
  } catch (error) {
    console.error('❌ Error checking biometric status:', error)
    
    return NextResponse.json(
      { error: 'Failed to check biometric status' },
      { status: 500 }
    )
  }
}

// Export the challenges store for use by the verify endpoint
export { challengesDb }