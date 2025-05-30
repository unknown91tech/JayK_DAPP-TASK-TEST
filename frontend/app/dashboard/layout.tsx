// app/dashboard/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  User, 
  Smartphone, 
  Shield, 
  FileText, 
  Activity, 
  Settings, 
  HelpCircle, 
  LogOut,
  Bell,
  Copy,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Check authentication status when component mounts
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.authenticated) {
          setUser(data.user)
          // Also fetch complete profile information
          fetchUserProfile()
        } else {
          // User is not authenticated, redirect to login
          router.push('/login')
        }
      } else {
        // Session is invalid, redirect to login
        router.push('/login')
      }
    } catch (error) {
      console.error('Authentication check failed:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(prev => ({ ...prev, ...data.profile }))
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout failed:', error)
      // Force redirect even if logout API fails
      router.push('/login')
    }
  }

  const copyOsId = async () => {
    if (user?.osId) {
      try {
        await navigator.clipboard.writeText(user.osId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy OS-ID:', error)
      }
    }
  }

  // Main navigation items for the sidebar
  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and quick actions'
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      description: 'Personal information'
    },
    {
      name: 'Devices',
      href: '/dashboard/devices',
      icon: Smartphone,
      description: 'Manage trusted devices'
    },
    {
      name: 'Security',
      href: '/dashboard/security',
      icon: Shield,
      description: 'Security settings'
    },
    {
      name: 'KYC Status',
      href: '/dashboard/kyc',
      icon: FileText,
      description: 'Verification status'
    },
    {
      name: 'Activity Logs',
      href: '/dashboard/activity',
      icon: Activity,
      description: 'Account activity'
    }
  ]

  // Bottom section navigation items
  const bottomNavItems = [
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings
    },
    {
      name: 'Help & Support',
      href: '/dashboard/help',
      icon: HelpCircle
    }
  ]

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background-primary flex overflow-hidden">
      {/* Sidebar - Fixed width and height */}
      <div className="w-64 bg-background-secondary border-r border-border-primary flex flex-col flex-shrink-0">
        {/* Logo section - matches header height exactly */}
        <div className="h-[73px] p-6 border-b border-border-primary flex items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-background-primary" />
            </div>
            <span className="text-xl font-bold text-foreground-primary">ONESTEP</span>
          </div>
        </div>

        {/* Main navigation - scrollable if needed */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-accent-primary text-background-primary' 
                    : 'text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  {!isActive && (
                    <div className="text-xs text-foreground-tertiary truncate">{item.description}</div>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Bottom navigation section */}
        <div className="p-4 border-t border-border-primary space-y-2 flex-shrink-0">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-accent-primary text-background-primary' 
                    : 'text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium truncate">{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* User OS-ID section at bottom */}
        {user?.osId && (
          <div className="p-4 border-t border-border-primary flex-shrink-0">
            <div className="text-xs text-foreground-tertiary mb-1">Your OneStep ID</div>
            <div className="flex items-center space-x-2 bg-background-tertiary rounded-lg p-2">
              <span className="text-sm font-mono text-foreground-primary flex-1 truncate">
                {user.osId}
              </span>
              <button
                onClick={copyOsId}
                className="p-1 hover:bg-background-primary rounded transition-colors flex-shrink-0"
                title="Copy OS-ID"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-status-success" />
                ) : (
                  <Copy className="w-4 h-4 text-foreground-secondary" />
                )}
              </button>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-status-success rounded-full"></div>
              <span className="text-xs text-foreground-tertiary">All Good</span>
            </div>
          </div>
        )}
      </div>

      {/* Main content area - takes remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header - exact height match with sidebar logo */}
        <header className="h-[73px] bg-background-secondary border-b border-border-primary px-6 flex-shrink-0">
          <div className="h-full flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground-primary">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Security status indicator */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-status-success/10 border border-status-success/20 rounded-lg">
                <div className="w-2 h-2 bg-status-success rounded-full"></div>
                <span className="text-sm font-medium text-status-success">Secure</span>
              </div>

              {/* Notification bell with badge */}
              <button className="p-2 hover:bg-background-tertiary rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-foreground-secondary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-status-error rounded-full"></div>
              </button>

              {/* User profile section */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground-primary">
                    {user?.firstName || user?.username || 'User'}
                  </div>
                  <div className="text-xs text-foreground-tertiary">
                    {user?.email || 'Verified Account'}
                  </div>
                </div>
                <div className="w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-background-primary">
                    {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-foreground-secondary" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content - scrollable area that takes remaining height */}
        <main className="flex-1 p-6 overflow-y-auto bg-background-primary">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}