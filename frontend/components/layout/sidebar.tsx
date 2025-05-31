"use client";

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  User, 
  Smartphone, 
  Shield, 
  FileCheck, 
  Activity,
  Settings,
  HelpCircle,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and quick actions'
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: User,
    description: 'Manage your account information'
  },
  {
    name: 'Devices',
    href: '/dashboard/devices',
    icon: Smartphone,
    description: 'Manage trusted devices (3/5)'
  },
  {
    name: 'Security',
    href: '/dashboard/security',
    icon: Shield,
    description: 'Security settings and monitoring'
  },
  {
    name: 'KYC Status',
    href: '/dashboard/kyc',
    icon: FileCheck,
    description: 'Identity verification status'
  },
  {
    name: 'Activity Logs',
    href: '/dashboard/activity',
    icon: Activity,
    description: 'View your security logs'
  }
]

const secondaryNavigation = [
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings
  },
  {
    name: 'Help & Support',
    href: '/help',
    icon: HelpCircle
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* OneStep logo */}
      <div className="p-6 border-b border-border-primary">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-background-primary" />
          </div>
          <span className="text-xl font-bold text-foreground-primary tracking-wider">
            ONESTEP
          </span>
        </Link>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-accent-primary text-background-primary"
                    : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary"
                )}
              >
                <Icon 
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive 
                      ? "text-background-primary" 
                      : "text-foreground-tertiary group-hover:text-foreground-secondary"
                  )} 
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>{item.name}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  {/* Description only shows on hover or active */}
                  <p className={cn(
                    "text-xs mt-0.5 transition-opacity",
                    isActive 
                      ? "text-background-primary/80 opacity-100" 
                      : "text-foreground-tertiary opacity-0 group-hover:opacity-100"
                  )}>
                    {item.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Secondary navigation */}
      <div className="p-4 border-t border-border-primary">
        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-accent-primary text-background-primary"
                    : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary"
                )}
              >
                <Icon 
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive 
                      ? "text-background-primary" 
                      : "text-foreground-tertiary group-hover:text-foreground-secondary"
                  )} 
                />
                {item.name}
              </Link>
            )
          })}
        </div>
        
        {/* OneStep ID display */}
        <div className="mt-4 p-3 bg-background-tertiary/50 rounded-lg">
          <p className="text-xs text-foreground-tertiary mb-1">Your OneStep ID</p>
          <code className="text-xs font-mono text-accent-primary">
            OS-2024-ABC123DEF
          </code>
        </div>
      </div>
    </div>
  )
}