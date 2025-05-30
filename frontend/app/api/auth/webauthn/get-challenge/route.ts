// app/api/auth/webauthn/get-challenge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'

// Validation schema for the challenge request
const challengeRequestSchema = z.object({
  type: z.enum(['login', 'register']), // Are we logging in or registering a new credential?
  method: z.enum(['touch', 'face']), // What type of biometric are we using?
  userId: z.string().optional() // Optional user ID for login attempts
})

// Utility function to convert Buffer to base64url encoding
// This is needed because WebAuthn uses base64url encoding (web-safe base64)
const bufferToBase64url = (buffer: Buffer): string => {
  return buffer.toString('base64')
    .replace(/\+/g, '-')     // Replace + with -
    .replace(/\//g, '_')     // Replace / with _
    .replace(/=+$/, '')      // Remove padding =
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔒 WebAuthn challenge request received')
    
    // Parse and validate the request body
    const body = await request.json()
    const { type, method, userId } = challengeRequestSchema.parse(body)
    
    console.log(`📝 Challenge type: ${type}, method: ${method}`)
    
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Generate a cryptographically secure random challenge
    // This challenge will be signed by the authenticator to prove possession of the private key
    const challenge = bufferToBase64url(randomBytes(32))
    console.log(`🎲 Generated challenge: ${challenge.substring(0, 10)}...`)
    
    if (type === 'login') {
      // For login, we need to find existing credentials for the user
      // In a real app, you'd identify the user through a session or pre-auth token
      // For this demo, we'll find the most recent user with biometric credentials
      
      let user
      if (userId) {
        // If we have a specific user ID, use that
        user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            biometrics: {
              where: { 
                isActive: true,
                deviceType: method // Match the requested biometric type
              }
            }
          }
        })
      } else {
        // Otherwise, find the most recent user with active biometric credentials
        // In production, you'd want a better way to identify the user
        user = await prisma.user.findFirst({
          where: {
            biometrics: {
              some: {
                isActive: true,
                deviceType: method
              }
            }
          },
          include: {
            biometrics: {
              where: { 
                isActive: true,
                deviceType: method
              }
            }
          },
          orderBy: { lastLoginAt: 'desc' }
        })
      }
      
      if (!user || user.biometrics.length === 0) {
        console.log('❌ No biometric credentials found for login')
        
        // Log the failed attempt
        await logSecurityEvent({
          eventType: 'BIOMETRIC_LOGIN_NO_CREDENTIALS',
          description: `No ${method} credentials found for user`,
          metadata: { method, userId },
          ipAddress: clientIp,
          userAgent: request.headers.get('user-agent') || undefined,
          riskLevel: 'MEDIUM'
        })
        
        return NextResponse.json(
          { 
            error: `No ${method === 'touch' ? 'Touch ID' : 'Face ID'} credentials found. Please set up biometric authentication first.`,
            needsSetup: true
          },
          { status: 404 }
        )
      }
      
      // Get the most recent credential for this biometric type
      const credential = user.biometrics[0]
      console.log(`✅ Found credential for user: ${user.osId}`)
      
      // Store the challenge temporarily in the database
      // In production, you might use Redis for this, but we'll use the database for simplicity
      const challengeKey = `webauthn_challenge_${user.id}_${Date.now()}`
      await prisma.systemConfig.upsert({
        where: { key: challengeKey },
        update: { 
          value: {
            challenge,
            userId: user.id,
            credentialId: credential.credentialId,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
          }
        },
        create: {
          key: challengeKey,
          value: {
            challenge,
            userId: user.id,
            credentialId: credential.credentialId,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
          },
          type: 'JSON',
          description: 'Temporary WebAuthn challenge for authentication'
        }
      })
      
      console.log(`💾 Challenge stored with key: ${challengeKey}`)
      
      // Log the challenge generation
      await logSecurityEvent({
        userId: user.id,
        eventType: 'BIOMETRIC_CHALLENGE_GENERATED',
        description: `WebAuthn challenge generated for ${method} authentication`,
        metadata: { 
          method, 
          credentialId: credential.credentialId,
          challengeKey 
        },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        riskLevel: 'LOW'
      })
      
      // Return the challenge data needed for WebAuthn authentication
      return NextResponse.json({
        challenge,
        userId: bufferToBase64url(Buffer.from(user.id)), // Convert user ID to base64url
        credentialId: credential.credentialId,
        timeout: 60000, // 60 seconds for user to complete authentication
        userVerification: 'required' // Force biometric verification
      })
      
    } else if (type === 'register') {
      // For registration, we're setting up a new biometric credential
      // This would typically happen during account setup or when adding a new device
      
      // In a real app, you'd get the user from the authenticated session
      // For this demo, we'll create a mock registration scenario
      
      console.log('📝 Preparing biometric registration challenge')
      
      // Generate a temporary user ID for the registration process
      const tempUserId = `temp_${Date.now()}_${randomBytes(8).toString('hex')}`
      
      // Store the registration challenge
      const challengeKey = `webauthn_register_${tempUserId}`
      await prisma.systemConfig.upsert({
        where: { key: challengeKey },
        update: { 
          value: {
            challenge,
            tempUserId,
            method,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
          }
        },
        create: {
          key: challengeKey,
          value: {
            challenge,
            tempUserId,
            method,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
          },
          type: 'JSON',
          description: 'Temporary WebAuthn challenge for registration'
        }
      })
      
      console.log(`💾 Registration challenge stored with key: ${challengeKey}`)
      
      // Log the registration challenge generation
      await logSecurityEvent({
        eventType: 'BIOMETRIC_REGISTER_CHALLENGE',
        description: `WebAuthn registration challenge generated for ${method}`,
        metadata: { 
          method, 
          tempUserId,
          challengeKey 
        },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        riskLevel: 'LOW'
      })
      
      // Return the challenge data needed for WebAuthn registration
      return NextResponse.json({
        challenge,
        userId: bufferToBase64url(Buffer.from(tempUserId)), // Temporary user ID
        userName: 'onestep_user', // Default username for registration
        userDisplayName: 'OneStep User', // Display name
        timeout: 60000, // 60 seconds for user to complete registration
        attestation: 'none', // We don't need attestation for this demo
        userVerification: 'required', // Force biometric verification
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Built-in authenticators (Touch ID, Face ID)
          userVerification: 'required',
          requireResidentKey: false
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256 algorithm
          { type: 'public-key', alg: -257 } // RS256 algorithm (fallback)
        ]
      })
    }
    
  } catch (error) {
    console.error('❌ WebAuthn challenge generation error:', error)
    
    // Log the error
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      eventType: 'BIOMETRIC_CHALLENGE_ERROR',
      description: 'WebAuthn challenge generation failed',
      metadata: { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'HIGH'
    }).catch(console.error) // Don't let logging errors crash the response
    
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
      { 
        error: 'Failed to generate authentication challenge',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}