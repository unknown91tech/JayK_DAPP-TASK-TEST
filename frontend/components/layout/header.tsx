'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  Menu, 
  User, 
  Settings, 
  LogOut,
  Shield
} from 'lucide-react'

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // This would normally come from your auth context
  const user = {
    osId: 'OS-2024-ABC123DEF',
    username: 'johnsmith_crypto',
    firstName: 'John',
    avatar: null // No avatar for now, will show initials
  }

  return (
    <div className="flex items-center justify-between px-6 py-4">
      {/* Left side - Mobile menu button and title */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          size="icon"
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        {/* Page title or breadcrumb would go here */}
        <div className="hidden sm:block">
          <h1 className="text-xl font-semibold text-foreground-primary">
            Dashboard
          </h1>
        </div>
      </div>

      {/* Right side - Notifications and user menu */}
      <div className="flex items-center space-x-3">
        {/* Security status indicator */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-status-success/10 border border-status-success/20 rounded-lg">
          <Shield className="w-4 h-4 text-status-success" />
          <span className="text-sm font-medium text-status-success">Secure</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-status-error rounded-full text-xs flex items-center justify-center text-white">
              2
            </span>
          </Button>

          {/* Notifications dropdown - simple version */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-background-secondary border border-border-primary rounded-xl shadow-xl z-50">
              <div className="p-4 border-b border-border-primary">
                <h3 className="font-semibold text-foreground-primary">Notifications</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start space-x-3 p-2 hover:bg-background-tertiary rounded-lg">
                  <div className="w-2 h-2 bg-accent-primary rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground-primary">
                      New dApp connection request
                    </p>
                    <p className="text-xs text-foreground-tertiary">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-2 hover:bg-background-tertiary rounded-lg">
                  <div className="w-2 h-2 bg-status-success rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground-primary">
                      Biometric login successful
                    </p>
                    <p className="text-xs text-foreground-tertiary">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <Button 
            variant="ghost" 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2"
          >
            {/* User avatar or initials */}
            <div className="w-8 h-8 bg-accent-primary text-background-primary rounded-full flex items-center justify-center text-sm font-bold">
              {user.firstName.charAt(0)}
            </div>
            <span className="hidden md:block text-sm font-medium text-foreground-primary">
              {user.firstName}
            </span>
          </Button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-background-secondary border border-border-primary rounded-xl shadow-xl z-50">
              {/* User info */}
              <div className="p-4 border-b border-border-primary">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent-primary text-background-primary rounded-full flex items-center justify-center font-bold">
                    {user.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground-primary">{user.firstName}</p>
                    <p className="text-xs text-foreground-tertiary">{user.osId}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2">
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-background-tertiary rounded-lg transition-colors">
                  <User className="w-4 h-4 text-foreground-secondary" />
                  <span className="text-sm text-foreground-primary">Profile</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-background-tertiary rounded-lg transition-colors">
                  <Settings className="w-4 h-4 text-foreground-secondary" />
                  <span className="text-sm text-foreground-primary">Settings</span>
                </button>
                
                <div className="border-t border-border-primary my-2"></div>
                
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-status-error/10 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4 text-status-error" />
                  <span className="text-sm text-status-error">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
