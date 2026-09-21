interface CardProps {
  children: React.ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function Card({ children, className = '', as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={[
        'bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg',
        className,
      ].join(' ')}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={['px-5 py-4 border-b border-[rgb(var(--border))]', className].join(' ')}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={['font-semibold text-[rgb(var(--text-1))]', className].join(' ')}>
      {children}
    </h3>
  )
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={['px-5 py-4', className].join(' ')}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={['px-5 py-3 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] rounded-b-lg', className].join(' ')}>
      {children}
    </div>
  )
}
