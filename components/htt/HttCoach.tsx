'use client'

/**
 * HTT Coach — streaming AI chat panel.
 * Uses SSE from /api/htt-coach, renders inline within the HTT page.
 */

import { useState, useRef, useEffect, useTransition } from 'react'
import { signalInteractionResponse } from '@/app/[tenant]/htt/actions'
import { HTT_STAGE_NAMES } from '@/app/[tenant]/htt/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string           // interaction id, filled in after stream completes
  signal?: string       // 'helpful' | 'not_helpful' | null
}

interface HttCoachProps {
  tenantSlug: string
  stage: number
  moduleContext?: string
}

export default function HttCoach({ tenantSlug, stage, moduleContext = 'htt' }: HttCoachProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const stageName = HTT_STAGE_NAMES[stage] ?? 'Unknown'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const trimmed = input.trim()
    if (!trimmed || streaming) return

    const userMsg: Message = { role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    // Placeholder for assistant reply
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/htt-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, moduleContext, tenantSlug }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
          return updated
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let interactionId: string | undefined
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break
          try {
            const parsed = JSON.parse(payload) as { text?: string; id?: string; error?: string }
            if (parsed.error) break
            if (parsed.id) interactionId = parsed.id
            if (parsed.text) {
              fullText += parsed.text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: fullText, id: interactionId }
                return updated
              })
            }
          } catch { /* ignore parse errors */ }
        }
      }

      // Stamp the interaction id onto the final message
      if (interactionId) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], id: interactionId }
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Connection error. Please try again.' }
        return updated
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handleSignal(msgIndex: number, interactionId: string, signal: 'helpful' | 'not_helpful') {
    setMessages(prev => {
      const updated = [...prev]
      updated[msgIndex] = { ...updated[msgIndex], signal }
      return updated
    })
    startTransition(async () => {
      await signalInteractionResponse(interactionId, signal)
    })
  }

  return (
    <div className="flex flex-col h-full min-h-[400px] bg-[rgb(var(--surface))] rounded-lg border border-[rgb(var(--border))] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[rgb(var(--border))] flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-[rgb(var(--text-1))]">HTT Coach</span>
          <span className="ml-2 text-xs text-[rgb(var(--text-3))]">Stage {stage} · {stageName}</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))] font-medium uppercase tracking-wide">
          AI
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-[rgb(var(--text-3))] text-center pt-8">
            Ask your HTT Coach anything — a thinking challenge, a framework to explore, or a decision you're working through.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={[
                'max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-[rgb(var(--color-primary))] text-white'
                  : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-1))]',
              ].join(' ')}
            >
              {msg.content}
              {msg.role === 'assistant' && !msg.content && streaming && (
                <span className="inline-block w-2 h-3 bg-[rgb(var(--text-3))] rounded-sm animate-pulse" />
              )}
            </div>
            {/* Feedback buttons for assistant messages */}
            {msg.role === 'assistant' && msg.content && msg.id && (
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() => handleSignal(i, msg.id!, 'helpful')}
                  disabled={!!msg.signal}
                  className={[
                    'text-xs px-2 py-0.5 rounded transition-colors',
                    msg.signal === 'helpful'
                      ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                      : 'text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))]',
                  ].join(' ')}
                >
                  👍 Helpful
                </button>
                <button
                  onClick={() => handleSignal(i, msg.id!, 'not_helpful')}
                  disabled={!!msg.signal}
                  className={[
                    'text-xs px-2 py-0.5 rounded transition-colors',
                    msg.signal === 'not_helpful'
                      ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))]',
                  ].join(' ')}
                >
                  👎 Not helpful
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[rgb(var(--border))] px-3 py-3 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your coach… (Enter to send)"
          rows={2}
          disabled={streaming}
          className="flex-1 resize-none text-sm px-3 py-2 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.3)] disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!input.trim() || streaming}
          className="px-3 py-2 rounded-md bg-[rgb(var(--color-primary))] text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {streaming ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
