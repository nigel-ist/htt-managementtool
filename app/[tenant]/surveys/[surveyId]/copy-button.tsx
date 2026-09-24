'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select the text for manual copy
    }
  }

  return (
    <button
      onClick={copy}
      className="shrink-0 px-3 py-2 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--text-2))] hover:bg-[rgb(var(--bg))] transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}
