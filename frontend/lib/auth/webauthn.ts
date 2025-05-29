// lib/auth/webauthn.ts
/**
 * WebAuthn helper functions for biometric authentication
 * This handles Touch ID, Face ID, and other biometric authentication methods
 */

// Types for WebAuthn operations
interface WebAuthnCredential {
  id: string
  publicKey: string
  counter: number
  deviceType: string
}

interface RegistrationOptions {
  challenge: string
  userId: string
  username: string
  displayName: string
}

interface AuthenticationOptions {
  challenge: string
  credentialIds: string[]
}

/**
 * Check if WebAuthn is supported in the current browser
 */
export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    window.navigator.credentials &&
    window.navigator.credentials.create &&
    window.navigator.credentials.get
  )
}

/**
 * Check if biometric authentication is available
 * This includes Touch ID, Face ID, Windows Hello, etc.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false
  }

  try {
    // Check if authenticator is available (platform authenticator = biometric)
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    return available
  } catch (error) {
    console.error('Error checking biometric availability:', error)
    return false
  }
}

/**
 * Register a new biometric credential
 * This creates a new credential tied to the user's biometric data
 */
export async function registerBiometric(options: RegistrationOptions): Promise<WebAuthnCredential> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser')
  }

  try {
    // Create credential creation options
    const credentialCreationOptions: CredentialCreationOptions = {
      publicKey: {
        // Challenge from server (should be random and used only once)
        challenge: Uint8Array.from(options.challenge, c => c.charCodeAt(0)),
        
        // Relying party (your domain)
        rp: {
          name: "OneStep Authentication",
          id: window.location.hostname,
        },
        
        // User information
        user: {
          id: Uint8Array.from(options.userId, c => c.charCodeAt(0)),
          name: options.username,
          displayName: options.displayName,
        },
        
        // Cryptographic parameters
        pubKeyCredParams: [
          {
            type: "public-key",
            alg: -7, // ES256 algorithm
          },
          {
            type: "public-key", 
            alg: -257, // RS256 algorithm
          }
        ],
        
        // Authenticator selection criteria
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Platform authenticator (built-in biometric)
          userVerification: "required", // Require biometric verification
          requireResidentKey: false
        },
        
        // Timeout
        timeout: 60000,
        
        // Attestation preference
        attestation: "direct"
      }
    }

    // Create the credential
    const credential = await navigator.credentials.create(credentialCreationOptions) as PublicKeyCredential
    
    if (!credential) {
      throw new Error('Failed to create credential')
    }

    // Extract the credential data
    const response = credential.response as AuthenticatorAttestationResponse
    const publicKey = Array.from(new Uint8Array(response.publicKey!))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Determine device type based on user agent
    const deviceType = getDeviceType()

    return {
      id: credential.id,
      publicKey,
      counter: 0, // Initial counter value
      deviceType
    }

  } catch (error) {
    console.error('Biometric registration failed:', error)
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Biometric registration was cancelled or not allowed')
      } else if (error.name === 'InvalidStateError') {
        throw new Error('This device is already registered for biometric authentication')
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Biometric authentication is not supported on this device')
      }
    }
    
    throw new Error('Biometric registration failed. Please try again.')
  }
}

/**
 * Authenticate using biometric credential
 * This verifies the user's identity using their registered biometric data
 */
export async function authenticateBiometric(options: AuthenticationOptions): Promise<{
  credentialId: string
  signature: string
  counter: number
}> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser')
  }

  try {
    // Create credential request options
    const credentialRequestOptions: CredentialRequestOptions = {
      publicKey: {
        // Challenge from server
        challenge: Uint8Array.from(options.challenge, c => c.charCodeAt(0)),
        
        // Allowed credentials (user's registered credentials)
        allowCredentials: options.credentialIds.map(id => ({
          type: "public-key" as const,
          id: Uint8Array.from(id, c => c.charCodeAt(0)),
          transports: ["internal"] as AuthenticatorTransport[]
        })),
        
        // User verification required
        userVerification: "required",
        
        // Timeout
        timeout: 60000
      }
    }

    // Get the credential
    const credential = await navigator.credentials.get(credentialRequestOptions) as PublicKeyCredential
    
    if (!credential) {
      throw new Error('Authentication failed')
    }

    // Extract authentication data
    const response = credential.response as AuthenticatorAssertionResponse
    const signature = Array.from(new Uint8Array(response.signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Extract counter (for replay attack prevention)
    const authData = new Uint8Array(response.authenticatorData)
    const counter = new DataView(authData.buffer).getUint32(33, false)

    return {
      credentialId: credential.id,
      signature,
      counter
    }

  } catch (error) {
    console.error('Biometric authentication failed:', error)
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Biometric authentication was cancelled')
      } else if (error.name === 'InvalidStateError') {
        throw new Error('No registered biometric credentials found')
      }
    }
    
    throw new Error('Biometric authentication failed. Please try again.')
  }
}

/**
 * Get device type for biometric registration
 */
function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase()
  
  // Check for specific biometric types
  if (/iphone|ipad|ipod/.test(userAgent)) {
    // iOS devices - could be Touch ID or Face ID
    if (userAgent.includes('iphone')) {
      // Newer iPhones have Face ID, older have Touch ID
      // This is a simplified check - in reality you'd need more sophisticated detection
      return 'face_id' // Assume Face ID for newer devices
    }
    return 'touch_id'
  }
  
  if (/android/.test(userAgent)) {
    return 'fingerprint' // Android biometric
  }
  
  if (/windows/.test(userAgent)) {
    return 'windows_hello'
  }
  
  if (/mac/.test(userAgent)) {
    return 'touch_id' // MacBook with Touch ID
  }
  
  return 'biometric' // Generic biometric
}

/**
 * Delete a biometric credential
 * Note: WebAuthn doesn't provide a way to delete credentials from the authenticator,
 * so this would typically just remove it from your server's database
 */
export async function deleteBiometricCredential(credentialId: string): Promise<void> {
  try {
    // Call your API to remove the credential from the database
    const response = await fetch('/api/auth/biometrics/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credentialId })
    })

    if (!response.ok) {
      throw new Error('Failed to delete biometric credential')
    }

  } catch (error) {
    console.error('Failed to delete biometric credential:', error)
    throw new Error('Failed to delete biometric credential')
  }
}

/**
 * List available biometric credential types on this device
 */
export async function getAvailableBiometricTypes(): Promise<string[]> {
  const types: string[] = []
  
  if (await isBiometricAvailable()) {
    const deviceType = getDeviceType()
    types.push(deviceType)
    
    // Could potentially support multiple types
    if (deviceType === 'face_id' && /iphone/.test(navigator.userAgent.toLowerCase())) {
      // Some newer iPhones might support both Face ID and Touch ID
      types.push('touch_id')
    }
  }
  
  return types
}

