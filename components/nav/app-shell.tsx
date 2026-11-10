'use client'

/**
 * AppShell — client wrapper that manages mobile sidebar open/close state.
 *
 * On mobile (< lg): sidebar slides in as a drawer over an overlay.
 * On desktop (lg+): sidebar is always visible inline.
 *
 * The server layout renders this with Sidebar + Topbar + children as slots.
 * topbar is a React node (not a render prop) so it can be passed safely
 * across the Server → Client Component boundary. The Topbar reads
 * openSidebar from SidebarContext instead of an onMenuOpen prop.
 */
import { useState, useCallback } from 'react'
import { SidebarContext } from './sidebar-context'

interface AppShellProps {
  sidebar: React.ReactNode
  topbar: React.ReactNode
  children: React.ReactNode
}

export default function AppShell({ sidebar, topbar, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const openSidebar  = useCallback(() => setSidebarOpen(true),  [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <SidebarContext.Provider value={{ openSidebar, closeSidebar }}>
      <div className="flex h-screen bg-[rgb(var(--bg))] overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — drawer on mobile, inline on desktop */}
        <div
          className={[
            'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto',
            'transition-transform duration-200 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
        >
          {/* Close sidebar on mobile when a nav link is clicked */}
          <div onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.closest('a') && window.innerWidth < 1024) closeSidebar()
          }}>
            {sidebar}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {topbar}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
