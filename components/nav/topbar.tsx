'use client'

/**
 * Workspace topbar — shows page breadcrumb and user context.
 */
import { usePathname } from 'next/navigation'

interface TopbarProps {
  tenantName: string
  tenantSlug: string
  isIlAdmin?: boolean
}

function getPageTitle(pathname: string, tenantSlug: string): string {
  const after = pathname.replace(`/${tenantSlug}`, '').replace(/^\//, '')
  const segment = after.split('/')[0]
  const labels: Record<string, string> = {
    dashboard:   'Dashboard',
    products:    'Products',
    innovations: 'Innovations',
    staff:       'Staff Skills',
    settings:    'Settings',
  }
  return labels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
}

export default function Topbar({ tenantName, tenantSlug, isIlAdmin }: TopbarProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname, tenantSlug)

  return (
    <header className="h-12 flex items-center justify-between px-6 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex-shrink-0">
      <span className="text-sm font-medium text-[rgb(var(--text-1))]">{title}</span>

      <div className="flex items-center gap-3">
        {isIlAdmin && (
          <span className="text-xs text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.1)] px-2 py-0.5 rounded font-medium">
            Viewing as IL Admin
          </span>
        )}
      </div>
    </header>
  )
}
