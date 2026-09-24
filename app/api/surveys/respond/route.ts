/**
 * POST /api/surveys/respond
 *
 * Public endpoint — no auth required.
 * Submits a survey response by share_token.
 *
 * Body: {
 *   token: string           // survey share_token
 *   name?: string
 *   email?: string
 *   answers: Record<string, string>  // questionId → answer
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let body: {
    token?: string
    name?: string
    email?: string
    answers?: Record<string, string>
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, name, email, answers } = body

  if (!token || !answers) {
    return NextResponse.json({ error: 'Missing token or answers' }, { status: 400 })
  }

  const service = createServiceClient()

  // Look up survey by token
  const { data: survey, error: surveyErr } = await service
    .from('surveys')
    .select('id, tenant_id, status')
    .eq('share_token', token)
    .single()

  if (surveyErr || !survey) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
  }

  if (survey.status !== 'active') {
    return NextResponse.json({ error: 'This survey is not currently accepting responses.' }, { status: 403 })
  }

  const { error: insertErr } = await service.from('survey_responses').insert({
    survey_id: survey.id,
    tenant_id: survey.tenant_id,
    respondent_name: name ?? null,
    respondent_email: email ?? null,
    data: answers,
  })

  if (insertErr) {
    console.error('[api/surveys/respond] insert error:', insertErr.message)
    return NextResponse.json({ error: 'Failed to save response.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
