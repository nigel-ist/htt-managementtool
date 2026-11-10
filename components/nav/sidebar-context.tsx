'use client'

/**
 * SidebarContext — shared mobile-sidebar open/close state.
 *
 * AppShell provides it. Topbar (and any other client component that
 * needs to open the drawer) consumes it via useSidebar().
 */
import { createContext, useContext } from 'react'

interface SidebarContextValue {
  openSidebar: () => void
  closeSidebar: () => void
}

export const SidebarContext = createContext<SidebarContextValue>({
  openSidebar: () => {},
  closeSidebar: () => {},
})

export function useSidebar() {
  return useContext(SidebarContext)
}
