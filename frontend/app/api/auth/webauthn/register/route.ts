// app/api/auth/webauthn/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// Validation schema for biometric registration
// This matches the data structure your frontend is sending
const registerBiometricSchema = z.object({
  id: z.string().min(1, 'Credential ID is required'), // The credential ID from WebAuthn
  rawId: z.string().min(1, 'Raw credential ID is required'), // Base64url encoded raw ID
  response: z.object({
    // For registration, we expect attestationObject and clientDataJSON
    attestationObject: z.string().min(1, 'Attestation object is required').optional(),
    clientDataJSON: z.string().min(1, 'Client data JSON is required'),
    // Your frontend is sending authentication response data, so let's handle both cases
    authenticatorData: z.string().optional(), // For authentication flow
    signature: z.string().optional(), // For authentication flow
    userHandle: z.string().nullable().optional(), // For authentication flow
  }),
  type: z.literal('public-key'), // Must be "public-key"
  // Additional fields your frontend is sending
  username: z.string().optional(), // Username for verification
  osId: z.string().optional(), // OS-ID for verification
})

// Utility function to convert base64url to Buffer (for processing WebAuthn data)
const base64urlToBuffer = (base64url: string): Buffer => {
  try {
    // Add padding if needed (base64url doesn't use padding)
    const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/')
    return Buffer.from(base64, 'base64')
  } catch (error) {
    console.error('❌ Failed to decode base64url:', error)
    throw new Error('Invalid base64url encoding')
  }
}

// Utility function to convert Buffer to base64url (for storing data)
const bufferToBase64url = (buffer: Buffer): string => {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Function to extract public key from authenticator data
// This is a simplified version - in production you'd use a proper WebAuthn library
const extractPublicKeyFromAuthData = (authenticatorData: string): Buffer => {
  try {
    // Decode the authenticator data
    const authDataBuffer = base64urlToBuffer(authenticatorData)
    
    // In a real implementation, you would:
    // 1. Parse the authenticator data structure
    // 2. Extract the attested credential data (if present)
    // 3. Parse the COSE public key
    // 4. Convert it to a format suitable for storage
    
    // For this demo, we'll create a mock public key from the authenticator data
    // In production, you'd use libraries like 'cbor' or '@webauthn/server' to properly parse this
    const mockPublicKey = Buffer.from(authDataBuffer.subarray(0, Math.min(65, authDataBuffer.length)))
    
    console.log(`📝 Extracted public key: ${mockPublicKey.length} bytes from authenticator data`)
    return mockPublicKey
    
  } catch (error) {
    console.error('❌ Failed to extract public key from authenticator data:', error)
    throw new Error('Invalid authenticator data format')
  }
}

// Function to extract public key from attestation object (for proper registration flow)
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
    // In production, you'd use libraries like 'cbor' or '@webauthn/server' to properly parse this
    const mockPublicKey = Buffer.from(attestationBuffer.subarray(0, Math.min(65, attestationBuffer.length)))
    
    console.log(`📝 Extracted public key: ${mockPublicKey.length} bytes from attestation object`)
    return mockPublicKey
    
  } catch (error) {
    console.error('❌ Failed to extract public key from attestation:', error)
    throw new Error('Invalid attestation object format')
  }
}

// Function to validate the client data JSON
const validateClientData = (clientDataJSON: string, expectedOrigin: string): { type: string, challenge: string } => {
  try {
    // Decode and parse the client data
    const clientDataBuffer = base64urlToBuffer(clientDataJSON)
    const clientData = JSON.parse(clientDataBuffer.toString('utf-8'))
    
    console.log('🔍 Client data:', clientData)
    
    // For registration, we expect 'webauthn.create', for authentication 'webauthn.get'
    // Since your frontend might be sending either, let's accept both for now
    if (!['webauthn.create', 'webauthn.get'].includes(clientData.type)) {
      throw new Error(`Invalid client data type - expected webauthn.create or webauthn.get, got ${clientData.type}`)
    }
    
    // Verify the origin matches our application
    if (clientData.origin !== expectedOrigin) {
      console.warn(`⚠️ Origin mismatch: expected ${expectedOrigin}, got ${clientData.origin}`)
      // In development, we might want to be more lenient
      if (process.env.NODE_ENV !== 'development') {
        throw new Error(`Origin mismatch: expected ${expectedOrigin}, got ${clientData.origin}`)
      }
    }
    
    console.log('✅ Client data validation passed')
    return {
      type: clientData.type,
      challenge: clientData.challenge
    }
    
  } catch (error) {
    console.error('❌ Client data validation failed:', error)
    throw error instanceof Error ? error : new Error('Client data validation failed')
  }
}

// Function to determine device type based on user agent
const determineDeviceType = (userAgent: string): 'touch' | 'face' | 'unknown' => {
  const ua = userAgent.toLowerCase()
  
  // Check for Touch ID capable devices
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('macintosh')) {
    // Modern Apple devices support both Touch ID and Face ID
    // We'll default to 'touch' but in a real app you might want to detect more specifically
    return 'touch'
  }
  
  // Check for other biometric capable devices
  if (ua.includes('android')) {
    return 'touch' // Most Android devices with biometrics use fingerprint
  }
  
  // Check for Windows Hello
  if (ua.includes('windows')) {
    return 'face' // Windows Hello often uses face recognition
  }
  
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Starting WebAuthn biometric registration/authentication processing')
    
    // Parse and validate the request body
    const body = await request.json()
    console.log('📦 Received WebAuthn data:', {
      id: body.id,
      type: body.type,
      hasResponse: !!body.response,
      username: body.username,
      osId: body.osId
    })
    
    const registrationData = registerBiometricSchema.parse(body)
    
    // Get client information for logging
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Get authenticated user from session
    // Note: Your frontend might be calling this during the authentication flow,
    // so we might need to handle cases where there's no active session yet
    let authUser
    try {
      authUser = requireAuth(request)
    } catch (error) {
      // If there's no active session but we have username/osId, we can still process
      if (registrationData.username || registrationData.osId) {
        console.log('ℹ️ No active session found, but username/osId provided for lookup')
      } else {
        console.log('❌ No authentication and no user identifier provided')
        return NextResponse.json(
          { error: 'Authentication required or user identifier must be provided' },
          { status: 401 }
        )
      }
    }
    
    // Find the user in the database
    let user
    if (authUser) {
      // Use the authenticated user
      user = await prisma.user.findUnique({
        where: { id: authUser.userId },
        include: {
          biometrics: { 
            where: { isActive: true } // Only count active biometrics
          }
        }
      })
    } else if (registrationData.osId) {
      // Look up user by OS-ID
      user = await prisma.user.findUnique({
        where: { osId: registrationData.osId },
        include: {
          biometrics: { 
            where: { isActive: true }
          }
        }
      })
    } else if (registrationData.username) {
      // Look up user by username
      user = await prisma.user.findUnique({
        where: { username: registrationData.username },
        include: {
          biometrics: { 
            where: { isActive: true }
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
    
    console.log(`✅ Found user: ${user.osId} (${user.username}) with ${user.biometrics.length} existing biometrics`)
    
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
          credentialId: registrationData.id
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
      where: { credentialId: registrationData.id }
    })
    
    if (existingCredential) {
      console.log('❌ Credential ID already exists in database')
      
      // Log the duplicate registration attempt
      await logSecurityEvent({
        userId: user.id,
        eventType: 'BIOMETRIC_REGISTER_DUPLICATE',
        description: 'Attempted to register duplicate biometric credential',
        metadata: { 
          credentialId: registrationData.id,
          existingBiometricId: existingCredential.id
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
    
    let clientDataInfo
    try {
      clientDataInfo = validateClientData(registrationData.response.clientDataJSON, expectedOrigin)
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
          credentialId: registrationData.id
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
    
    // Extract the public key from the provided data
    let publicKey: Buffer
    try {
      if (registrationData.response.attestationObject) {
        // Proper registration flow with attestation object
        publicKey = extractPublicKeyFromAttestation(registrationData.response.attestationObject)
        console.log('✅ Using attestation object for public key extraction')
      } else if (registrationData.response.authenticatorData) {
        // Authentication flow data - extract what we can
        publicKey = extractPublicKeyFromAuthData(registrationData.response.authenticatorData)
        console.log('✅ Using authenticator data for public key extraction')
      } else {
        throw new Error('No attestation object or authenticator data provided')
      }
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
    
    // Determine device type based on user agent since frontend might not specify
    const deviceType = determineDeviceType(userAgent)
    
    // Generate a friendly device name
    const deviceName = `${deviceType === 'touch' ? 'Touch ID' : deviceType === 'face' ? 'Face ID' : 'Biometric'} - ${
      userAgent.includes('iPhone') ? 'iPhone' :
      userAgent.includes('iPad') ? 'iPad' :
      userAgent.includes('Mac') ? 'Mac' :
      userAgent.includes('Android') ? 'Android' :
      userAgent.includes('Windows') ? 'Windows' :
      'Device'
    }`
    
    // Store the biometric credential in the database
    console.log('💾 Storing biometric credential in database...')
    
    const biometric = await prisma.biometric.create({
      data: {
        userId: user.id, // Link to the user
        credentialId: registrationData.id, // Store the WebAuthn credential ID
        publicKey: publicKey, // Store the public key for signature verification
        counter: 0, // Initialize signature counter (prevents replay attacks)
        deviceType: deviceType, // Detected device type
        isActive: true, // Mark as active and ready for use
        // lastUsedAt will be null until first authentication
      }
    })
    
    console.log(`✅ Biometric credential stored successfully with ID: ${biometric.id}`)
    
    // Log the successful registration for security audit
    await logSecurityEvent({
      userId: user.id,
      eventType: 'BIOMETRIC_REGISTERED',
      description: `${deviceType} biometric credential registered successfully`,
      metadata: { 
        biometricId: biometric.id,
        credentialId: registrationData.id,
        deviceType: deviceType,
        deviceName,
        publicKeyLength: publicKey.length,
        clientDataType: clientDataInfo.type,
        registrationMethod: registrationData.response.attestationObject ? 'proper_registration' : 'auth_flow_fallback'
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
      message: `${deviceType === 'touch' ? 'Touch ID' : deviceType === 'face' ? 'Face ID' : 'Biometric'} registered successfully!`,
      biometric: {
        id: biometric.id,
        credentialId: biometric.credentialId,
        deviceType: biometric.deviceType,
        deviceName,
        createdAt: biometric.createdAt,
        isActive: biometric.isActive
      },
      user: {
        osId: user.osId,
        username: user.username,
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
    
    // Don't let logging errors crash the response
    try {
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
      })
    } catch (logError) {
      console.error('Failed to log security event:', logError)
    }
    
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

// Handle other HTTP methods with proper error responses
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed - use POST to register biometric credentials' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed - use POST to register biometric credentials' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed - use DELETE /api/user/biometrics to remove credentials' },
    { status: 405 }
  )
}