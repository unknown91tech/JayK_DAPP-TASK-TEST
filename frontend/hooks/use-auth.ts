// hooks/use-auth.ts
"use client";

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
import React from 'react'

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
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isSetupComplete: boolean
  login: (token: string, userData: User) => void
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  refreshSession: () => Promise<boolean>
}

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null)

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
        if (window.location.pathname.startsWith('/dashboard')) {
          router.push('/login')
        }
      }
    })

    // Set up auto-refresh interval (every 25 minutes)
    const refreshInterval = setInterval(async () => {
      const success = await autoRefreshSession()
      if (!success && user) {
        logout()
      }
    }, 25 * 60 * 1000)

    return () => {
      clearInterval(refreshInterval)
    }
  }, [router, user])

  const login = (token: string, userData: User) => {
    setUser(userData)
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      clearSession()
      setUser(null)
      router.push('/login')
    }
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
    }
  }

  const refreshSession = async (): Promise<boolean> => {
    return autoRefreshSession()
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: user !== null && user.isVerified,
    isSetupComplete: user !== null && user.isSetupComplete,
    login,
    logout,
    updateUser,
    refreshSession
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

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