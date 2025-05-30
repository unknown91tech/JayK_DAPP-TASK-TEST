// lib/auth/webauthn.ts
import { randomBytes } from 'crypto'

/**
 * WebAuthn Helper Functions
 * These functions help with WebAuthn data conversion and validation
 */

// Convert ArrayBuffer to base64url (web-safe base64 without padding)
export function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i])
  }
  return btoa(str)
    .replace(/\+/g, '-')  // Replace + with -
    .replace(/\//g, '_')  // Replace / with _
    .replace(/=+$/, '')   // Remove padding
}

// Convert base64url string to ArrayBuffer
export function base64urlToBuffer(base64url: string): ArrayBuffer {
  // Add padding if needed
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = (base64url + padding)
    .replace(/-/g, '+')   // Replace - with +
    .replace(/_/g, '/')   // Replace _ with /
  
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const bytes = new Uint8Array(buffer)
  
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i)
  }
  
  return buffer
}

// Generate a cryptographically secure random challenge for WebAuthn
export function generateWebAuthnChallenge(): string {
  const challengeBuffer = randomBytes(32) // 32 bytes = 256 bits of entropy
  return challengeBuffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Validate that a credential ID is properly formatted
export function isValidCredentialId(credentialId: string): boolean {
  // Credential IDs should be base64url encoded and at least 16 bytes
  try {
    const buffer = base64urlToBuffer(credentialId)
    return buffer.byteLength >= 16 // At least 16 bytes for security
  } catch (error) {
    return false
  }
}

// Parse WebAuthn authenticator data during authentication
export interface AuthenticatorData {
  rpIdHash: Buffer
  flags: number
  signCount: number
  userPresent: boolean
  userVerified: boolean
  attestedCredentialDataIncluded: boolean
  extensionDataIncluded: boolean
}

export function parseAuthenticatorData(authDataBuffer: ArrayBuffer): AuthenticatorData {
  const buffer = Buffer.from(authDataBuffer)
  
  // WebAuthn authenticator data structure:
  // Bytes 0-31: rpIdHash (SHA-256 of relying party ID)
  // Byte 32: flags
  // Bytes 33-36: signCount (big-endian uint32)
  // Bytes 37+: optional attested credential data and extensions
  
  if (buffer.length < 37) {
    throw new Error('Authenticator data is too short')
  }
  
  const rpIdHash = buffer.subarray(0, 32)
  const flags = buffer[32]
  const signCount = buffer.readUInt32BE(33)
  
  // Parse the flags byte
  const userPresent = (flags & 0x01) !== 0 // Bit 0: User Present
  const userVerified = (flags & 0x04) !== 0 // Bit 2: User Verified
  const attestedCredentialDataIncluded = (flags & 0x40) !== 0 // Bit 6: Attested Credential Data
  const extensionDataIncluded = (flags & 0x80) !== 0 // Bit 7: Extension Data
  
  return {
    rpIdHash,
    flags,
    signCount,
    userPresent,
    userVerified,
    attestedCredentialDataIncluded,
    extensionDataIncluded
  }
}

// Validate the relying party ID hash matches our domain
export function validateRpIdHash(rpIdHash: Buffer, expectedRpId: string): boolean {
  const crypto = require('crypto')
  const expectedHash = crypto.createHash('sha256').update(expectedRpId).digest()
  return rpIdHash.equals(expectedHash)
}

// Parse client data JSON from WebAuthn response
export interface ClientData {
  type: string
  challenge: string
  origin: string
  crossOrigin?: boolean
  tokenBinding?: {
    status: string
    id?: string
  }
}

export function parseClientDataJSON(clientDataJSON: string): ClientData {
  try {
    const buffer = base64urlToBuffer(clientDataJSON)
    const jsonString = Buffer.from(buffer).toString('utf-8')
    const clientData = JSON.parse(jsonString)
    
    // Validate required fields
    if (!clientData.type || !clientData.challenge || !clientData.origin) {
      throw new Error('Missing required fields in client data')
    }
    
    return clientData
  } catch (error) {
    throw new Error('Failed to parse client data JSON')
  }
}

// Validate that the challenge in client data matches what we expect
export function validateChallenge(clientData: ClientData, expectedChallenge: string): boolean {
  return clientData.challenge === expectedChallenge
}

// Validate that the origin matches our expected origin
export function validateOrigin(clientData: ClientData, expectedOrigin: string): boolean {
  return clientData.origin === expectedOrigin
}

// Generate WebAuthn credential creation options for registration
export interface CredentialCreationOptions {
  challenge: string
  rp: {
    name: string
    id: string
  }
  user: {
    id: string
    name: string
    displayName: string
  }
  pubKeyCredParams: Array<{
    type: 'public-key'
    alg: number
  }>
  timeout?: number
  attestation?: 'none' | 'indirect' | 'direct'
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform'
    userVerification?: 'required' | 'preferred' | 'discouraged'
    requireResidentKey?: boolean
  }
  excludeCredentials?: Array<{
    type: 'public-key'
    id: string
    transports?: ('usb' | 'nfc' | 'ble' | 'internal' | 'hybrid')[]
  }>
}

export function generateCredentialCreationOptions(
  userId: string,
  userName: string,
  displayName: string,
  rpName: string,
  rpId: string,
  excludeCredentials: string[] = []
): CredentialCreationOptions {
  return {
    challenge: generateWebAuthnChallenge(),
    rp: {
      name: rpName,
      id: rpId
    },
    user: {
      id: bufferToBase64url(Buffer.from(userId)), // Convert user ID to base64url
      name: userName,
      displayName: displayName
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },   // ES256 (ECDSA with SHA-256)
      { type: 'public-key', alg: -257 }  // RS256 (RSASSA-PKCS1-v1_5 with SHA-256)
    ],
    timeout: 60000, // 60 seconds
    attestation: 'none', // We don't need attestation for this implementation
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Built-in authenticators only (Touch ID, Face ID)
      userVerification: 'required', // Force biometric verification
      requireResidentKey: false // Don't require resident keys
    },
    excludeCredentials: excludeCredentials.map(credId => ({
      type: 'public-key' as const,
      id: credId,
      transports: ['internal'] // Platform authenticators use internal transport
    }))
  }
}

// Generate WebAuthn credential request options for authentication
export interface CredentialRequestOptions {
  challenge: string
  timeout?: number
  rpId?: string
  allowCredentials?: Array<{
    type: 'public-key'
    id: string
    transports?: ('usb' | 'nfc' | 'ble' | 'internal' | 'hybrid')[]
  }>
  userVerification?: 'required' | 'preferred' | 'discouraged'
}

export function generateCredentialRequestOptions(
  credentialIds: string[],
  rpId?: string
): CredentialRequestOptions {
  return {
    challenge: generateWebAuthnChallenge(),
    timeout: 60000, // 60 seconds
    rpId: rpId,
    allowCredentials: credentialIds.map(credId => ({
      type: 'public-key' as const,
      id: credId,
      transports: ['internal'] // Platform authenticators use internal transport
    })),
    userVerification: 'required' // Force biometric verification
  }
}

// Simplified COSE key parsing for demo purposes
// In production, you'd use a proper COSE library
export interface COSEKey {
  kty: number // Key type
  alg: number // Algorithm
  crv?: number // Curve (for EC keys)
  x?: Buffer // X coordinate (for EC keys)
  y?: Buffer // Y coordinate (for EC keys)
  n?: Buffer // Modulus (for RSA keys)
  e?: Buffer // Exponent (for RSA keys)
}

export function parseCOSEKey(coseKeyBuffer: Buffer): COSEKey {
  // This is a simplified COSE key parser for demonstration
  // In production, you'd use a proper CBOR/COSE library
  
  // For this demo, we'll return a mock parsed key
  // The actual implementation would parse the CBOR-encoded COSE key
  return {
    kty: 2, // EC2 key type
    alg: -7, // ES256 algorithm
    crv: 1, // P-256 curve
    x: coseKeyBuffer.subarray(0, 32), // Mock X coordinate
    y: coseKeyBuffer.subarray(32, 64) // Mock Y coordinate
  }
}

// Convert COSE key to PEM format for use with Node.js crypto
export function coseKeyToPem(coseKey: COSEKey): string {
  // This would convert the COSE key to PEM format
  // For this demo, we'll return a placeholder
  // In production, you'd implement proper key conversion
  
  if (coseKey.kty === 2 && coseKey.crv === 1) {
    // EC P-256 key - would convert to PEM format
    return '-----BEGIN PUBLIC KEY-----\n[Base64 encoded key]\n-----END PUBLIC KEY-----'
  } else if (coseKey.kty === 3) {
    // RSA key - would convert to PEM format
    return '-----BEGIN PUBLIC KEY-----\n[Base64 encoded RSA key]\n-----END PUBLIC KEY-----'
  }
  
  throw new Error('Unsupported key type')
}

// Database helper functions for WebAuthn operations
export interface BiometricCredential {
  id: string
  userId: string
  credentialId: string
  publicKey: Buffer
  counter: number
  deviceType: string
  isActive: boolean
  createdAt: Date
  lastUsedAt?: Date
}

// Store a new biometric credential in the database
export async function storeBiometricCredential(
  userId: string,
  credentialId: string,
  publicKey: Buffer,
  deviceType: 'touch' | 'face',
  deviceName?: string
): Promise<BiometricCredential> {
  // In a real implementation, this would use your Prisma client
  // For this demo, we'll show the structure
  
  const biometric = {
    id: `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    credentialId,
    publicKey,
    counter: 0,
    deviceType,
    isActive: true,
    createdAt: new Date(),
    lastUsedAt: undefined
  }
  
  // This would be: return await prisma.biometric.create({ data: biometric })
  console.log('📝 Would store biometric credential:', {
    ...biometric,
    publicKey: `[${publicKey.length} bytes]`
  })
  
  return biometric
}

// Retrieve biometric credentials for a user
export async function getUserBiometricCredentials(
  userId: string,
  deviceType?: 'touch' | 'face'
): Promise<BiometricCredential[]> {
  // This would query the database for active biometric credentials
  // return await prisma.biometric.findMany({
  //   where: {
  //     userId,
  //     isActive: true,
  //     ...(deviceType && { deviceType })
  //   }
  // })
  
  console.log('🔍 Would query biometric credentials for user:', userId, deviceType)
  return []
}

// Update biometric credential counter after successful authentication
export async function updateBiometricCounter(
  credentialId: string,
  newCounter: number
): Promise<void> {
  // This would update the signature counter in the database
  // await prisma.biometric.update({
  //   where: { credentialId },
  //   data: { 
  //     counter: newCounter,
  //     lastUsedAt: new Date()
  //   }
  // })
  
  console.log('🔄 Would update biometric counter:', credentialId, newCounter)
}

// Deactivate a biometric credential
export async function deactivateBiometricCredential(
  credentialId: string
): Promise<void> {
  // This would deactivate the credential in the database
  // await prisma.biometric.update({
  //   where: { credentialId },
  //   data: { isActive: false }
  // })
  
  console.log('🚫 Would deactivate biometric credential:', credentialId)
}

// WebAuthn error handling
export class WebAuthnError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'WebAuthnError'
  }
}

// Common WebAuthn error codes
export const WebAuthnErrorCodes = {
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  INVALID_CREDENTIAL: 'INVALID_CREDENTIAL',
  CHALLENGE_MISMATCH: 'CHALLENGE_MISMATCH',
  ORIGIN_MISMATCH: 'ORIGIN_MISMATCH',
  SIGNATURE_INVALID: 'SIGNATURE_INVALID',
  COUNTER_INVALID: 'COUNTER_INVALID',
  USER_CANCELLED: 'USER_CANCELLED',
  TIMEOUT: 'TIMEOUT',
  REGISTRATION_FAILED: 'REGISTRATION_FAILED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED'
} as const

// Helper function to handle WebAuthn exceptions
export function handleWebAuthnError(error: any): WebAuthnError {
  if (error instanceof WebAuthnError) {
    return error
  }
  
  // Map common browser errors to our error codes
  if (error.name === 'NotSupportedError') {
    return new WebAuthnError(
      'WebAuthn is not supported on this device',
      WebAuthnErrorCodes.NOT_SUPPORTED
    )
  }
  
  if (error.name === 'NotAllowedError') {
    return new WebAuthnError(
      'User cancelled the operation or operation timed out',
      WebAuthnErrorCodes.USER_CANCELLED
    )
  }
  
  if (error.name === 'InvalidStateError') {
    return new WebAuthnError(
      'The authenticator is already registered',
      WebAuthnErrorCodes.INVALID_CREDENTIAL
    )
  }
  
  if (error.name === 'SecurityError') {
    return new WebAuthnError(
      'Security error during WebAuthn operation',
      WebAuthnErrorCodes.AUTHENTICATION_FAILED
    )
  }
  
  // Default error
  return new WebAuthnError(
    error.message || 'Unknown WebAuthn error',
    WebAuthnErrorCodes.AUTHENTICATION_FAILED,
    error
  )
}