'use client'

import { useState, useEffect } from 'react'
import { 
  isWebAuthnSupported, 
  isBiometricAvailable, 
  registerBiometric, 
  authenticateBiometric,
  getAvailableBiometricTypes
} from '@/lib/auth/webauthn'

interface BiometricState {
  supported: boolean
  available: boolean
  availableTypes: string[]
  loading: boolean
  error: string | null
}

/**
 * Hook for biometric authentication management
 */
export function useBiometrics() {
  const [state, setState] = useState<BiometricState>({
    supported: false,
    available: false,
    availableTypes: [],
    loading: true,
    error: null
  })

  // Check biometric support on mount
  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        const supported = isWebAuthnSupported()
        const available = supported ? await isBiometricAvailable() : false
        const availableTypes = available ? await getAvailableBiometricTypes() : []

        setState({
          supported,
          available,
          availableTypes,
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to check biometric support'
        }))
      }
    }

    checkBiometricSupport()
  }, [])

  // Register new biometric credential
  const register = async (options: {
    userId: string
    username: string
    displayName: string
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Get challenge from server
      const challengeResponse = await fetch('/api/auth/biometrics/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'registration' })
      })
      
      if (!challengeResponse.ok) {
        throw new Error('Failed to get registration challenge')
      }
      
      const { challenge } = await challengeResponse.json()
      
      // Register biometric credential
      const credential = await registerBiometric({
        challenge,
        userId: options.userId,
        username: options.username,
        displayName: options.displayName
      })
      
      // Send credential to server
      const registerResponse = await fetch('/api/auth/biometrics/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      })
      
      if (!registerResponse.ok) {
        throw new Error('Failed to register biometric credential')
      }
      
      setState(prev => ({ ...prev, loading: false }))
      return true
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Biometric registration failed'
      }))
      return false
    }
  }

  // Authenticate using biometric
  const authenticate = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Get challenge from server
      const challengeResponse = await fetch('/api/auth/biometrics/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'authentication' })
      })
      
      if (!challengeResponse.ok) {
        throw new Error('Failed to get authentication challenge')
      }
      
      const { challenge, credentialIds } = await challengeResponse.json()
      
      // Authenticate with biometric
      const authResult = await authenticateBiometric({
        challenge,
        credentialIds
      })
      
      // Send authentication result to server
      const authResponse = await fetch('/api/auth/biometrics/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authResult })
      })
      
      if (!authResponse.ok) {
        throw new Error('Biometric authentication failed')
      }
      
      setState(prev => ({ ...prev, loading: false }))
      return true
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Biometric authentication failed'
      }))
      return false
    }
  }

  return {
    ...state,
    register,
    authenticate
  }
}