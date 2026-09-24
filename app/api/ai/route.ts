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

    competition_analysis: `You are a competitive intelligence strategist. Analyse the competitor data provided
and give a clear, structured competitive landscape assessment. Identify the most significant threats,
potential gaps to exploit, and strategic positioning recommendations. Be direct and specific. 3–4 paragraphs.`,

    market_intel_summary: `You are a market analyst. Synthesise the market intelligence entries provided
into a coherent picture of the market landscape. Identify the most significant signals, emerging patterns,
and strategic implications for the organisation. Be analytical and specific, not generic. 3–4 paragraphs.\`,

    staff_skills_analysis: \`You are an organisational capability analyst. Review the team skill data provided
and give a clear assessment of the team's capability profile. Identify skill concentrations and gaps,
single points of failure (skills held by only one person), development priorities, and any strategic
risk the current capability mix creates. Be specific about which skills matter most. 3–4 paragraphs.\`,

    innovation_pipeline_analysis: \`You are an innovation portfolio strategist. Analyse the pipeline data provided
and give a clear assessment of pipeline health. Comment on stage distribution (bottlenecks, dry stages,
over-concentration), the balance between incremental and potentially transformative ideas, and which items
look most ready to advance. Offer one or two prioritisation recommendations. 3–4 paragraphs.\`,

    idea_portfolio_analysis: \`You are an innovation analyst. Review the idea backlog provided
and identify the most important themes, the ideas with the clearest strategic potential, and what the
status distribution reveals about how well ideas are progressing through the organisation's review process.
Surface any patterns worth acting on. 3–4 paragraphs.\`,

    finance_analysis: \`You are a financial analyst advising an organisation. Review the financial data provided
(revenue, expenses, investments, grants) and give a clear assessment of the organisation's financial picture.
Comment on the revenue–expense balance, sustainability, financial concentration risks (reliance on a single
income source), and what the investment pattern suggests about priorities. Be direct and use numbers. 3–4 paragraphs.\`,

    compensation_analysis: \`You are a compensation and HR strategy expert. Review the pay bands provided
and give a clear assessment of the compensation structure. Identify whether the bands reflect market norms,
whether there are internal equity risks (compressed bands, gaps between levels), and what the overall
structure reveals about how the organisation values different roles. Be specific and constructive. 3–4 paragraphs.\`,
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
