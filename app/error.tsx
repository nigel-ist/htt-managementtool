'use client'

/**
 * Root app error boundary — catches errors thrown by nested layouts,
 * including app/[tenant]/layout.tsx, which the sibling error.tsx cannot reach.
 */
import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppError boundary]', error.message, error.stack, 'digest:', error.digest)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto mt-16 p-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
      <h2 className="text-base font-semibold text-red-700 dark:text-red-300 mb-2">
        Server error (digest: {error.digest ?? 'n/a'})
      </h2>
      <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-all mb-4 bg-white dark:bg-black/30 rounded p-3 border border-red-100 dark:border-red-900">
        {error.message}
      </pre>
      <button
        onClick={reset}
        className="text-sm font-medium px-4 py-2 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
