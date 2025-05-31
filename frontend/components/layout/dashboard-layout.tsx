"use client";

import { ReactNode, useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      <div className="flex">
        {/* Sidebar - hidden on mobile, fixed on desktop */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
          <div className="flex-1 flex flex-col min-h-0 bg-background-secondary/80 backdrop-blur-lg border-r border-border-primary">
            <Sidebar />
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Sidebar */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-background-secondary border-r border-border-primary">
              {/* Close button */}
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 lg:pl-64">
          {/* Top header */}
          <header className="sticky top-0 z-20 bg-background-secondary/80 backdrop-blur-lg border-b border-border-primary">
            <Header onMenuClick={() => setSidebarOpen(true)} />
          </header>

          {/* Page content */}
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}