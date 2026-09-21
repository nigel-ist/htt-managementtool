import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[rgb(var(--text-2))]"
          >
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border rounded',
            'text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] focus:border-[rgb(var(--color-primary))]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-400 dark:border-red-600'
              : 'border-[rgb(var(--border))]',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[rgb(var(--text-3))]">{hint}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
export type { InputProps }
