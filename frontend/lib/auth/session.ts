/**
 * Session management utilities for OneStep authentication
 * Handles client-side session operations and storage
 */

interface SessionData {
  osId: string
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  isVerified: boolean
  isSetupComplete: boolean
  expiresAt: string
}

/**
 * Store session data securely in browser
 * Uses httpOnly cookies for security when possible
 */
export function storeSession(token: string, userData: SessionData): void {
  // Store minimal user data in localStorage for UI purposes
  // Sensitive data should only be in httpOnly cookies
  const publicUserData = {
    osId: userData.osId,
    username: userData.username,
    firstName: userData.firstName,
    isVerified: userData.isVerified,
    isSetupComplete: userData.isSetupComplete
  }
  
  localStorage.setItem('onestep_user', JSON.stringify(publicUserData))
  
  // Session token should be stored in httpOnly cookie by the server
  // But for client-side operations, we can store expiry info
  localStorage.setItem('onestep_session_expiry', userData.expiresAt)
}

/**
 * Get current session data from browser storage
 */
export function getSession(): SessionData | null {
  try {
    const userData = localStorage.getItem('onestep_user')
    const expiresAt = localStorage.getItem('onestep_session_expiry')
    
    if (!userData || !expiresAt) {
      return null
    }
    
    // Check if session has expired
    if (new Date(expiresAt) <= new Date()) {
      clearSession()
      return null
    }
    
    return {
      ...JSON.parse(userData),
      expiresAt
    }
  } catch (error) {
    console.error('Error reading session data:', error)
    clearSession()
    return null
  }
}

/**
 * Clear session data from browser storage
 */
export function clearSession(): void {
  localStorage.removeItem('onestep_user')
  localStorage.removeItem('onestep_session_expiry')
  
  // Clear session cookie (this should ideally be done by the server)
  document.cookie = 'onestep-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; httpOnly; secure; sameSite=lax'
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  const session = getSession()
  return session !== null && session.isVerified
}

/**
 * Check if user has completed the setup process
 */
export function isSetupComplete(): boolean {
  const session = getSession()
  return session !== null && session.isSetupComplete
}

/**
 * Get the current user's OS-ID
 */
export function getCurrentOsId(): string | null {
  const session = getSession()
  return session?.osId || null
}

/**
 * Update session data (for profile updates, etc.)
 */
export function updateSession(updates: Partial<SessionData>): void {
  const currentSession = getSession()
  if (!currentSession) return
  
  const updatedSession = { ...currentSession, ...updates }
  localStorage.setItem('onestep_user', JSON.stringify(updatedSession))
}

/**
 * Auto-refresh session token before expiry
 * This should be called periodically to maintain user sessions
 */
export async function autoRefreshSession(): Promise<boolean> {
  const session = getSession()
  if (!session) return false
  
  const expiryDate = new Date(session.expiresAt)
  const now = new Date()
  const timeUntilExpiry = expiryDate.getTime() - now.getTime()
  
  // Refresh if token expires within next 30 minutes
  if (timeUntilExpiry < 30 * 60 * 1000) {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include' // Include cookies
      })
      
      if (response.ok) {
        const data = await response.json()
        // Update session expiry
        localStorage.setItem('onestep_session_expiry', data.expiresAt)
        return true
      } else {
        // Refresh failed, clear session
        clearSession()
        return false
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
      return false
    }
  }
  
  return true // Session is still valid
}

/**
 * Listen for session changes across browser tabs
 * This ensures consistent auth state across multiple tabs
 */
export function setupSessionSync(onSessionChange: (session: SessionData | null) => void): void {
  // Listen for localStorage changes (from other tabs)
  window.addEventListener('storage', (event) => {
    if (event.key === 'onestep_user' || event.key === 'onestep_session_expiry') {
      const session = getSession()
      onSessionChange(session)
    }
  })
  
  // Listen for focus events to check session validity
  window.addEventListener('focus', () => {
    const session = getSession()
    onSessionChange(session)
  })
}

/**
 * Generate device fingerprint for session security
 * This helps identify devices and detect suspicious activity
 */
export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx!.textBaseline = 'top'
  ctx!.font = '14px Arial'
  ctx!.fillText('Device fingerprint', 2, 2)
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|')
  
  // Simple hash function (in production, use a proper hash)
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36)
}