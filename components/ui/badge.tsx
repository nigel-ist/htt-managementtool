type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'text-[rgb(var(--text-2))] bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))]',
  primary:  'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.1)]',
  success:  'text-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent)/0.1)]',
  warning:  'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950',
  danger:   'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
