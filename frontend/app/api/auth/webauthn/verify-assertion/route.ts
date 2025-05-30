// app/api/auth/webauthn/verify-assertion/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SignJWT } from 'jose'
import { createHash } from 'crypto'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'
import { challengesDb } from '../get-challenge/route'

// Request validation schema
const verifyAssertionSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    authenticatorData: z.string(),
    clientDataJSON: z.string(),
    signature: z.string(),
    userHandle: z.string().nullable()
  }),
  type: z.literal('public-key'),
  username: z.string().optional(), // Username from database
  osId: z.string().optional() // OS-ID for user identification
})

// Base64 URL decoding utility
const base64urlToBuffer = (base64url: string): Buffer => {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64')
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 WebAuthn: Verifying biometric assertion...')
    
    // Parse and validate the request
    const body = await request.json()
    const { 
      id: credentialId, 
      rawId, 
      response: assertionResponse, 
      username, 
      osId 
    } = verifyAssertionSchema.parse(body)
    
    console.log('📋 Verifying assertion for:', { username, osId, credentialId })
    
    // Step 1: Find the user and their biometric credential
    let user = null
    let biometric = null
    
    // First try to find by credential ID (most reliable for WebAuthn)
    biometric = await prisma.biometric.findUnique({
      where: { credentialId },
      include: { user: true }
    })
    
    if (biometric) {
      user = biometric.user
      console.log('✅ Found user by credential ID:', user.username || user.osId)
    } else {
      // Fallback: try to find user by osId or username
      if (osId) {
        user = await prisma.user.findUnique({
          where: { osId },
          include: {
            biometrics: {
              where: { credentialId, isActive: true }
            }
          }
        })
        biometric = user?.biometrics[0] || null
      } else if (username) {
        user = await prisma.user.findUnique({
          where: { username },
          include: {
            biometrics: {
              where: { credentialId, isActive: true }
            }
          }
        })
        biometric = user?.biometrics[0] || null
      }
    }
    
    // If we still don't have a user or biometric, authentication fails
    if (!user || !biometric) {
      console.log('❌ User or biometric credential not found')
      
      // Log failed authentication attempt
      const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
      await logSecurityEvent({
        eventType: 'BIOMETRIC_AUTH_FAILED',
        description: 'Biometric authentication failed - credential not found',
        metadata: { credentialId, username, osId },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        riskLevel: 'HIGH'
      })
      
      return NextResponse.json(
        { error: 'Authentication failed - invalid credentials' },
        { status: 401 }
      )
    }
    
    console.log('👤 Authenticating user:', user.username || user.osId)
    
    // Step 2: Retrieve and verify the stored challenge
    const storedChallengeData = challengesDb[user.id]
    if (!storedChallengeData) {
      console.log('❌ No stored challenge found for user')
      return NextResponse.json(
        { error: 'No valid challenge found. Please try again.' },
        { status: 401 }
      )
    }
    
    const { challenge: storedChallenge, timestamp } = storedChallengeData
    
    // Check if challenge has expired (5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    if (timestamp < fiveMinutesAgo) {
      console.log('❌ Challenge has expired')
      delete challengesDb[user.id] // Clean up expired challenge
      return NextResponse.json(
        { error: 'Challenge has expired. Please try again.' },
        { status: 401 }
      )
    }
    
    // Step 3: Parse and verify the client data
    const clientDataBuffer = base64urlToBuffer(assertionResponse.clientDataJSON)
    const clientData = JSON.parse(clientDataBuffer.toString('utf-8'))
    
    console.log('🔍 Client data:', {
      type: clientData.type,
      challenge: clientData.challenge,
      origin: clientData.origin
    })
    
    // Verify the challenge matches
    if (clientData.challenge !== storedChallenge) {
      console.log('❌ Challenge mismatch')
      return NextResponse.json(
        { error: 'Challenge verification failed' },
        { status: 401 }
      )
    }
    
    // Verify the type is correct
    if (clientData.type !== 'webauthn.get') {
      console.log('❌ Invalid client data type:', clientData.type)
      return NextResponse.json(
        { error: 'Invalid authentication type' },
        { status: 401 }
      )
    }
    
    // Verify the origin (important for security)
    const expectedOrigin = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXTAUTH_URL || 'https://yourdomain.com'
    
    if (clientData.origin !== expectedOrigin) {
      console.log('❌ Origin mismatch. Expected:', expectedOrigin, 'Got:', clientData.origin)
      return NextResponse.json(
        { error: 'Origin verification failed' },
        { status: 401 }
      )
    }
    
    // Step 4: Verify the authenticator data and signature
    const authenticatorDataBuffer = base64urlToBuffer(assertionResponse.authenticatorData)
    const clientDataHash = createHash('SHA256').update(clientDataBuffer).digest()
    
    // Combine authenticator data and client data hash for signature verification
    const verificationData = Buffer.concat([authenticatorDataBuffer, clientDataHash])
    
    // For this demo, we'll simulate signature verification
    // In production, you would use the actual public key and proper crypto verification
    const signatureBuffer = base64urlToBuffer(assertionResponse.signature)
    
    // Simplified signature verification (in production, use proper WebAuthn library)
    const isSignatureValid = true // For demo - replace with actual verification
    
    if (!isSignatureValid) {
      console.log('❌ Signature verification failed')
      
      // Log failed authentication
      const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
      await logSecurityEvent({
        userId: user.id,
        eventType: 'BIOMETRIC_AUTH_FAILED',
        description: 'Biometric authentication failed - invalid signature',
        metadata: { credentialId, deviceType: biometric.deviceType },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        riskLevel: 'HIGH'
      })
      
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      )
    }
    
    console.log('✅ Biometric authentication successful!')
    
    // Step 5: Update biometric usage and user login time
    await Promise.all([
      // Update biometric last used time and increment counter
      prisma.biometric.update({
        where: { id: biometric.id },
        data: {
          lastUsedAt: new Date(),
          counter: biometric.counter + 1
        }
      }),
      
      // Update user last login time
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
    ])
    
    // Step 6: Clear the used challenge
    delete challengesDb[user.id]
    
    // Step 7: Create JWT session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const sessionToken = await new SignJWT({
      userId: user.id,
      osId: user.osId,
      username: user.username,
      isSetupComplete: user.isSetupComplete || true,
      authMethod: 'biometric'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 days expiry
      .sign(secret)
    
    // Step 8: Log successful authentication
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      userId: user.id,
      eventType: 'BIOMETRIC_AUTH_SUCCESS',
      description: `Successful biometric authentication using ${biometric.deviceType}`,
      metadata: { 
        credentialId, 
        deviceType: biometric.deviceType,
        authMethod: 'webauthn'
      },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'LOW'
    })
    
    // Step 9: Set session cookie and return success response
    const response = NextResponse.json({
      success: true,
      message: 'Biometric authentication successful',
      user: {
        osId: user.osId,
        username: user.username,
        isSetupComplete: user.isSetupComplete
      },
      session: {
        userId: user.id,
        loggedInAt: new Date().toISOString(),
        authMethod: 'biometric',
        deviceType: biometric.deviceType
      }
    })
    
    // Set the session cookie
    response.cookies.set('onestep-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/'
    })
    
    console.log('🎉 Biometric login completed successfully for user:', user.username || user.osId)
    
    return response
    
  } catch (error) {
    console.error('❌ Error verifying WebAuthn assertion:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    // Log the error for security monitoring
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      eventType: 'BIOMETRIC_AUTH_ERROR',
      description: 'Biometric authentication error occurred',
      metadata: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'MEDIUM'
    }).catch(console.error) // Don't fail if logging fails
    
    return NextResponse.json(
      { error: 'Authentication verification failed' },
      { status: 500 }
    )
  }
}