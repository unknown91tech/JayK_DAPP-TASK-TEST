// app/api/auth/webauthn/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// Validation schema for biometric registration
const registerBiometricSchema = z.object({
  id: z.string().min(1, 'Credential ID is required'), // The credential ID from WebAuthn
  rawId: z.string().min(1, 'Raw credential ID is required'), // Base64url encoded raw ID
  response: z.object({
    attestationObject: z.string().min(1, 'Attestation object is required'), // Contains public key
    clientDataJSON: z.string().min(1, 'Client data JSON is required'), // Client context
  }),
  type: z.literal('public-key'), // Must be "public-key"
  deviceType: z.enum(['touch', 'face']), // What type of biometric was registered
  deviceName: z.string().optional() // Optional friendly name for the device
})

// Utility function to convert base64url to Buffer (for processing WebAuthn data)
const base64urlToBuffer = (base64url: string): Buffer => {
  // Add padding if needed (base64url doesn't use padding)
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64')
}

// Function to parse the attestation object and extract public key
// This is a simplified version - in production you'd use a proper CBOR library
const extractPublicKeyFromAttestation = (attestationObject: string): Buffer => {
  try {
    // Decode the attestation object
    const attestationBuffer = base64urlToBuffer(attestationObject)
    
    // In a real implementation, you would:
    // 1. Parse the CBOR-encoded attestation object
    // 2. Extract the authData from it
    // 3. Parse the authData to get the attested credential data
    // 4. Extract the COSE public key from the credential data
    // 5. Convert it to a format suitable for storage
    
    // For this demo, we'll create a mock public key from the attestation data
    // In production, you'd use libraries like 'cbor' or 'fido2-lib' to properly parse this
    const mockPublicKey = Buffer.from(attestationBuffer.subarray(0, 65)) // Typical EC P-256 key size
    
    console.log(`📝 Extracted public key: ${mockPublicKey.length} bytes`)
    return mockPublicKey
    
  } catch (error) {
    console.error('❌ Failed to extract public key:', error)
    throw new Error('Invalid attestation object format')
  }
}

// Function to validate the client data JSON
const validateClientData = (clientDataJSON: string, expectedOrigin: string): void => {
  try {
    // Decode and parse the client data
    const clientDataBuffer = base64urlToBuffer(clientDataJSON)
    const clientData = JSON.parse(clientDataBuffer.toString('utf-8'))
    
    // Verify this is a registration operation
    if (clientData.type !== 'webauthn.create') {
      throw new Error('Invalid client data type - expected webauthn.create')
    }
    
    // Verify the origin matches our application
    if (clientData.origin !== expectedOrigin) {
      throw new Error(`Origin mismatch: expected ${expectedOrigin}, got ${clientData.origin}`)
    }
    
    console.log('✅ Client data validation passed')
    
  } catch (error) {
    console.error('❌ Client data validation failed:', error)
    throw error instanceof Error ? error : new Error('Client data validation failed')
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Starting WebAuthn biometric registration')
    
    // Parse and validate the request body
    const body = await request.json()
    const registration = registerBiometricSchema.parse(body)
    
    console.log(`🔑 Registering ${registration.deviceType} biometric credential`)
    
    // Get client information for logging
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Get authenticated user from session (using your existing auth middleware)
    const authUser = requireAuth(request)
    
    // Find the user in the database with their existing biometric credentials
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        biometrics: { 
          where: { isActive: true } // Only count active biometrics
        }
      }
    })
    
    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Found user: ${user.osId} with ${user.biometrics.length} existing biometrics`)
    
    // Check if user already has the maximum number of biometric credentials
    const maxBiometrics = 3 // Allow up to 3 biometric credentials per user
    if (user.biometrics.length >= maxBiometrics) {
      console.log(`❌ User has reached maximum biometric limit: ${user.biometrics.length}/${maxBiometrics}`)
      
      // Log the attempt for security monitoring
      await logSecurityEvent({
        userId: user.id,
        eventType: 'BIOMETRIC_REGISTER_LIMIT_EXCEEDED',
        description: 'User attempted to register biometric beyond limit',
        metadata: { 
          currentCount: user.biometrics.length,
          maxAllowed: maxBiometrics,
          attemptedType: registration.deviceType
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'MEDIUM'
      })
      
      return NextResponse.json(
        { 
          error: `Maximum number of biometric credentials (${maxBiometrics}) reached. Please remove an existing one first.`,
          maxReached: true,
          currentCount: user.biometrics.length
        },
        { status: 400 }
      )
    }
    
    // Check if this exact credential is already registered
    const existingCredential = await prisma.biometric.findUnique({
      where: { credentialId: registration.id }
    })
    
    if (existingCredential) {
      console.log('❌ Credential ID already exists in database')
      
      // Log the duplicate registration attempt
      await logSecurityEvent({
        userId: user.id,
        eventType: 'BIOMETRIC_REGISTER_DUPLICATE',
        description: 'Attempted to register duplicate biometric credential',
        metadata: { 
          credentialId: registration.id,
          deviceType: registration.deviceType
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'MEDIUM'
      })
      
      return NextResponse.json(
        { 
          error: 'This biometric credential is already registered',
          duplicate: true
        },
        { status: 409 }
      )
    }
    
    // Validate the client data to ensure this is a legitimate registration
    const expectedOrigin = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXTAUTH_URL || 'https://yourdomain.com'
    
    try {
      validateClientData(registration.response.clientDataJSON, expectedOrigin)
    } catch (error) {
      console.log('❌ Client data validation failed:', error)
      
      // Log the validation failure for security monitoring
      await logSecurityEvent({
        userId: user.id,
        eventType: 'BIOMETRIC_REGISTER_INVALID_CLIENT_DATA',
        description: 'Biometric registration failed client data validation',
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown validation error',
          expectedOrigin,
          credentialId: registration.id
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'HIGH'
      })
      
      return NextResponse.json(
        { 
          error: 'Registration validation failed',
          details: error instanceof Error ? error.message : 'Invalid registration data'
        },
        { status: 400 }
      )
    }
    
    // Extract the public key from the attestation object
    let publicKey: Buffer
    try {
      publicKey = extractPublicKeyFromAttestation(registration.response.attestationObject)
    } catch (error) {
      console.log('❌ Failed to extract public key:', error)
      
      return NextResponse.json(
        { 
          error: 'Failed to process biometric credential',
          details: error instanceof Error ? error.message : 'Invalid credential format'
        },
        { status: 400 }
      )
    }
    
    // Generate a friendly device name if not provided
    const deviceName = registration.deviceName || 
      `${registration.deviceType === 'touch' ? 'Touch ID' : 'Face ID'} - ${
        userAgent.includes('iPhone') ? 'iPhone' :
        userAgent.includes('iPad') ? 'iPad' :
        userAgent.includes('Mac') ? 'Mac' :
        'Device'
      }`
    
    // Store the biometric credential in the database
    console.log('💾 Storing biometric credential in database...')
    
    const biometric = await prisma.biometric.create({
      data: {
        userId: user.id, // Link to the authenticated user
        credentialId: registration.id, // Store the WebAuthn credential ID
        publicKey: publicKey, // Store the public key for signature verification
        counter: 0, // Initialize signature counter (prevents replay attacks)
        deviceType: registration.deviceType, // 'touch' or 'face'
        isActive: true, // Mark as active and ready for use
        // lastUsedAt will be null until first authentication
      }
    })
    
    console.log(`✅ Biometric credential stored successfully with ID: ${biometric.id}`)
    
    // Log the successful registration for security audit
    await logSecurityEvent({
      userId: user.id,
      eventType: 'BIOMETRIC_REGISTERED',
      description: `${registration.deviceType} biometric credential registered successfully`,
      metadata: { 
        biometricId: biometric.id,
        credentialId: registration.id,
        deviceType: registration.deviceType,
        deviceName,
        publicKeyLength: publicKey.length
      },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'LOW'
    })
    
    // Check if this completes the user's setup process
    const totalActiveBiometrics = await prisma.biometric.count({
      where: { 
        userId: user.id,
        isActive: true
      }
    })
    
    // If this is their first biometric and they have other required setup completed,
    // mark their setup as complete
    let isSetupComplete = user.isSetupComplete
    if (!isSetupComplete && user.username && user.passcodeHash && totalActiveBiometrics >= 1) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isSetupComplete: true }
      })
      isSetupComplete = true
      console.log('🎉 User setup marked as complete!')
    }
    
    // Return success response with relevant information
    return NextResponse.json({
      success: true,
      message: `${registration.deviceType === 'touch' ? 'Touch ID' : 'Face ID'} registered successfully!`,
      biometric: {
        id: biometric.id,
        deviceType: biometric.deviceType,
        deviceName,
        createdAt: biometric.createdAt,
        isActive: biometric.isActive
      },
      user: {
        osId: user.osId,
        totalBiometrics: totalActiveBiometrics,
        isSetupComplete,
        canAddMore: totalActiveBiometrics < maxBiometrics
      }
    })
    
  } catch (error) {
    console.error('❌ WebAuthn biometric registration error:', error)
    
    // Log the error for monitoring and debugging
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    await logSecurityEvent({
      eventType: 'BIOMETRIC_REGISTER_ERROR',
      description: 'Biometric registration encountered an error',
      metadata: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined // Truncate stack trace
      },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'HIGH'
    }).catch(console.error) // Don't let logging errors crash the response
    
    // Handle different types of errors appropriately
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid registration data format',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }
    
    // Handle authentication errors (from requireAuth middleware)
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Please log in to register biometric credentials' },
        { status: 401 }
      )
    }
    
    // Generic error response (don't leak internal details in production)
    return NextResponse.json(
      { 
        error: 'Biometric registration failed',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error'
          : 'Please try again or contact support if the problem persists'
      },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}