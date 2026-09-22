/**
 * Server-side AI route.
 *
 * All Anthropic API calls run here — the API key (ANTHROPIC_API_KEY)
 * is a Vercel environment variable and never reaches the browser.
 *
 * POST /api/ai
 * Body: { purpose: string, context: string, prompt: string, tenantSlug: string }
 * Returns: { result: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerJWTClaims } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  // Auth check — must be a logged-in user
  const claims = await getServerJWTClaims()
  if (!claims) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let body: {
    purpose?: string
    context?: string
    prompt?: string
    tenantSlug?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { purpose, context, prompt } = body

  if (!purpose || !prompt) {
    return NextResponse.json({ error: 'Missing required fields: purpose, prompt' }, { status: 400 })
  }

  // System prompt varies by purpose
  const systemPrompts: Record<string, string> = {
    future_state_narrative: `You are a strategic advisor helping a business articulate its future vision.
Your task is to write a clear, compelling, and realistic narrative that connects the organisation's
current state to its desired future. The narrative should be written in first-person plural ("we"),
be specific rather than generic, acknowledge where the organisation is today, and paint a vivid
picture of where it is heading. Keep it to 3–4 paragraphs. Avoid business clichés.`,

    current_state_summary: `You are a strategic analyst. Summarise the organisation's current strengths
and critical gaps based on the assessment data provided. Be direct and honest. 2–3 paragraphs.`,

    product_analysis: `You are a product strategy expert. Analyse the product information provided
and give a clear, structured assessment. Focus on market opportunity, competitive dynamics, and
strategic fit. Be specific and actionable. 3–5 paragraphs.`,
  }

  const systemPrompt = systemPrompts[purpose] ?? `You are a helpful strategic business advisor.
Answer concisely and professionally. 2–4 paragraphs.`

  const userMessage = context
    ? `Context:\n${context}\n\n---\n\n${prompt}`
    : prompt

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')

    return NextResponse.json({ result: text })
  } catch (err) {
    console.error('[api/ai] Anthropic error:', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
