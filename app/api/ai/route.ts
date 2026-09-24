/**
 * Server-side AI route.
 *
 * All Anthropic API calls run here — the API key (ANTHROPIC_API_KEY)
 * is a Vercel environment variable and never reaches the browser.
 *
 * POST /api/ai
 * Body: { purpose: string, context: string, prompt: string, tenantSlug: string, httStage?: number }
 * Returns: { result: string }
 *
 * When `httStage` is supplied (1–5), an HTT Mode addendum is appended to the
 * system prompt so the response adapts its language, scaffolding, and questioning
 * style to match the user's current stage of thinking development.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerJWTClaims } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * HTT Mode addendum — appended to any system prompt when httStage is provided.
 * Adjusts vocabulary, scaffolding level, and questioning style to match the
 * user's stage of thinking development without changing the core purpose.
 */
function httModeAddendum(stage: number): string {
  const addenda: Record<number, string> = {
    1: `

HTT MODE — Stage 1 (Acquisition): The reader is building foundational thinking skills. Use clear, structured language. Define any strategic concepts you introduce. Offer concrete examples and break complex ideas into distinct steps. Avoid jargon and business clichés. End with one simple, grounding question they can reflect on.`,

    2: `

HTT MODE — Stage 2 (Fluency): The reader is developing confidence with strategic frameworks. Use clear language; you may reference common business concepts without defining them. Structure your response with light signposting. Offer one or two guiding questions to prompt their own reflection.`,

    3: `

HTT MODE — Stage 3 (Maintenance): The reader applies thinking skills consistently in their domain. Write as you would for a capable professional. You may reference frameworks by name. Encourage them to connect this analysis to their own strategic context, and offer a question that bridges the general to their specific situation.`,

    4: `

HTT MODE — Stage 4 (Generalisation): The reader transfers thinking across domains and contexts. Write peer-to-peer. Highlight non-obvious connections, tensions, and second-order effects. Challenge assumptions where warranted. Invite them to consider alternative framings or analogies from adjacent fields.`,

    5: `

HTT MODE — Stage 5 (Adaptive): The reader operates at an expert generative level. Write as a genuine thought partner. Engage fully with nuance and ambiguity. Prioritise insight over reassurance. Surface the hardest questions rather than resolving them — your role here is to extend their thinking, not conclude it.`,
  }
  return addenda[stage] ?? ''
}

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
    httStage?: number
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { purpose, context, prompt, httStage } = body

  if (!purpose || !prompt) {
    return NextResponse.json({ error: 'Missing required fields: purpose, prompt' }, { status: 400 })
  }

  // Base system prompt varies by purpose
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

  const basePrompt = systemPrompts[purpose] ?? `You are a helpful strategic business advisor.
Answer concisely and professionally. 2–4 paragraphs.`

  // Append HTT Mode addendum when the caller supplies the user's current stage
  const systemPrompt = httStage
    ? basePrompt + httModeAddendum(httStage)
    : basePrompt

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
