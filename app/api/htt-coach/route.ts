/**
 * POST /api/htt-coach
 *
 * Streaming HTT Coach endpoint.
 * Picks up the user's latest HTT stage, builds a stage-aware system prompt,
 * streams a response via claude-haiku-4-5, then logs the interaction.
 *
 * Body: { message: string; moduleContext?: string; tenantSlug: string }
 * Returns: text/event-stream (SSE) — compatible with useChat or manual EventSource
 */

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import { buildCoachSystemPrompt } from '@/app/[tenant]/htt/types'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { message, moduleContext = 'htt', tenantSlug } = await req.json() as {
      message: string
      moduleContext?: string
      tenantSlug: string
    }

    if (!message?.trim() || !tenantSlug) {
      return new Response('Missing message or tenantSlug', { status: 400 })
    }

    // Auth
    const claims = await getServerJWTClaims()
    if (!claims?.sub) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Resolve tenant
    const supabase = await createClient()
    const tenantId: string | null = claims.tenant_id ?? (await (async () => {
      const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
      return data?.id ?? null
    })())
    if (!tenantId) return new Response('Tenant not found', { status: 404 })

    // Get latest baseline for this user
    const { data: baseline } = await supabase
      .from('htt_baselines')
      .select('id, stage, scores')
      .eq('tenant_id', tenantId)
      .eq('user_id', claims.sub)
      .order('assessed_at', { ascending: false })
      .limit(1)
      .single()

    const stage = (baseline?.stage as number) ?? 1
    const baselineId = (baseline?.id as string) ?? null

    const systemPrompt = buildCoachSystemPrompt(stage, moduleContext)

    // Stream from claude-haiku
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await anthropic.messages.stream({
            model: 'claude-haiku-4-5',
            max_tokens: 512,
            system: systemPrompt,
            messages: [{ role: 'user', content: message }],
          })

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text
              fullResponse += text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`))
          controller.close()
          return
        }

        // Log interaction after stream completes (fire-and-forget)
        try {
          const service = createServiceClient()
          await service.from('htt_interactions').insert({
            tenant_id: tenantId,
            user_id: claims.sub,
            baseline_id: baselineId,
            module_context: moduleContext,
            prompt_type: 'coach',
            htt_stage: stage,
            user_message: message,
            ai_response: fullResponse,
          })
        } catch {
          // Non-critical: logging failure should not surface to user
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    console.error('[htt-coach]', err)
    return new Response('Internal server error', { status: 500 })
  }
}
