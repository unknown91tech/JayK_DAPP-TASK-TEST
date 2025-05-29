// app/dashboard/layout.tsx
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      <div className="flex">
        {/* Sidebar - fixed on larger screens, collapsible on mobile */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex-1 flex flex-col min-h-0 bg-background-secondary/80 backdrop-blur-lg border-r border-border-primary">
            <Sidebar />
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 lg:pl-64">
          {/* Top header */}
          <header className="sticky top-0 z-30 bg-background-secondary/80 backdrop-blur-lg border-b border-border-primary">
            <Header />
          </header>

          {/* Main content */}
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