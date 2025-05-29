// hooks/use-auth.ts
'use client'

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getSession, 
  clearSession, 
  isAuthenticated, 
  isSetupComplete,
  getCurrentOsId,
  autoRefreshSession,
  setupSessionSync
} from '@/lib/auth/session'

// Types for our auth context
interface User {
  osId: string
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  isVerified: boolean
  isSetupComplete: boolean
}

interface AuthContextType {
  // Current user data
  user: User | null
  // Loading states
  loading: boolean
  // Authentication status
  isAuthenticated: boolean
  isSetupComplete: boolean
  // Actions
  login: (token: string, userData: User) => void
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  refreshSession: () => Promise<boolean>
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Auth Provider Component
 * Wraps the app and provides authentication state to all components
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      const session = getSession()
      if (session) {
        setUser({
          osId: session.osId,
          username: session.username,
          firstName: session.firstName,
          lastName: session.lastName,
          email: session.email,
          isVerified: session.isVerified,
          isSetupComplete: session.isSetupComplete
        })
      }
      setLoading(false)
    }

    initializeAuth()

    // Set up session sync across tabs
    setupSessionSync((session) => {
      if (session) {
        setUser({
          osId: session.osId,
          username: session.username,
          firstName: session.firstName,
          lastName: session.lastName,
          email: session.email,
          isVerified: session.isVerified,
          isSetupComplete: session.isSetupComplete
        })
      } else {
        setUser(null)
        // Redirect to login if session was cleared
        if (window.location.pathname.startsWith('/dashboard')) {
          router.push('/login')
        }
      }
    })

    // Set up auto-refresh interval (every 25 minutes)
    const refreshInterval = setInterval(async () => {
      const success = await autoRefreshSession()
      if (!success && user) {
        // Session couldn't be refreshed, log out user
        logout()
      }
    }, 25 * 60 * 1000)

    return () => {
      clearInterval(refreshInterval)
    }
  }, [router, user])

  // Login function
  const login = (token: string, userData: User) => {
    setUser(userData)
    // Session storage is handled by the API response setting cookies
  }

  // Logout function
  const logout = async () => {
    try {
      // Call logout API to invalidate server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Clear local session data regardless of API success
      clearSession()
      setUser(null)
      router.push('/login')
    }
  }

  // Update user data
  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      // Update session storage
      // updateSession(updatedUser) // This function would need to be imported
    }
  }

  // Refresh session
  const refreshSession = async (): Promise<boolean> => {
    return autoRefreshSession()
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    isAuthenticated: user !== null && user.isVerified,
    isSetupComplete: user !== null && user.isSetupComplete,
    login,
    logout,
    updateUser,
    refreshSession
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth Hook
 * Provides access to authentication state and actions
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook to require authentication
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  return { isAuthenticated, loading }
}

/**
 * Hook to require setup completion
 * Redirects to setup flow if user hasn't completed setup
 */
export function useRequireSetup() {
  const { isSetupComplete, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated && !isSetupComplete) {
      router.push('/setup-account')
    }
  }, [isSetupComplete, isAuthenticated, loading, router])

  return { isSetupComplete, loading }
}