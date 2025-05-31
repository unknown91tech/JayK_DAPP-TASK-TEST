// lib/auth/jwt.ts
import { SignJWT, jwtVerify } from 'jose'
import { nanoid } from 'nanoid'

// JWT payload interface for OneStep authentication
export interface JWTPayload {
  // User identification
  userId: string
  osId: string
  username?: string
  
  // Authentication status
  isSetupComplete: boolean
  isVerified: boolean
  
  // Security metadata
  deviceId?: string
  loginMethod: 'telegram' | 'passcode' | 'biometric' | 'otp'
  
  // Standard JWT claims
  iat: number // Issued at
  exp: number // Expires at
  jti: string // JWT ID (for revocation)
}

/**
 * Create a new JWT session token
 * This is used after successful authentication to maintain user sessions
 */
export async function createSessionToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>): Promise<string> {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set')
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  
  // Create the JWT with our payload
  const jwt = await new SignJWT({
    ...payload,
    jti: nanoid() // Unique JWT ID for potential revocation
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days expiry
    .setIssuer('onestep-auth')
    .setAudience('onestep-users')
    .sign(secret)

  return jwt
}

/**
 * Verify and decode a JWT session token
 * Returns the payload if valid, throws error if invalid/expired
 */
export async function verifySessionToken(token: string): Promise<JWTPayload> {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set')
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'onestep-auth',
      audience: 'onestep-users'
    })

    return payload as unknown as JWTPayload
  } catch (error) {
    // Handle different JWT errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new Error('Session has expired. Please log in again.')
      } else if (error.message.includes('invalid')) {
        throw new Error('Invalid session. Please log in again.')
      }
    }
    
    throw new Error('Session verification failed')
  }
}

/**
 * Create a temporary token for setup flow
 * Used during account setup when user hasn't completed all steps yet
 */
export async function createTempToken(payload: {
  userId: string
  osId: string
  setupStep: string
}): Promise<string> {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set')
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  
  const jwt = await new SignJWT({
    ...payload,
    temp: true,
    jti: nanoid()
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h') // Short expiry for setup flow
    .setIssuer('onestep-auth')
    .setAudience('onestep-setup')
    .sign(secret)

  return jwt
}

/**
 * Refresh a session token (extend expiry)
 * Used to keep users logged in without requiring re-authentication
 */
export async function refreshSessionToken(token: string): Promise<string> {
  // First verify the current token
  const payload = await verifySessionToken(token)
  
  // Create a new token with extended expiry
  return createSessionToken({
    userId: payload.userId,
    osId: payload.osId,
    username: payload.username,
    isSetupComplete: payload.isSetupComplete,
    isVerified: payload.isVerified,
    deviceId: payload.deviceId,
    loginMethod: payload.loginMethod
  })
}

/**
 * Extract token from Authorization header or cookies
 */
export function extractToken(authHeader?: string, cookies?: string): string | null {
  // Check Authorization header first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Check cookies
  if (cookies) {
    const match = cookies.match(/onestep-session=([^;]+)/)
    if (match) {
      return match[1]
    }
  }
  
  return null
}