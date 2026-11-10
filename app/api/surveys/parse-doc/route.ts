/**
 * POST /api/surveys/parse-doc
 *
 * Accepts a PDF, DOCX, or TXT file and uses the AI to extract survey questions.
 * Returns a list of parsed questions in SurveyQuestion format.
 *
 * The caller (ImportResponsesPanel) can then push these into the survey's
 * question list via a separate update action.
 *
 * Auth: JWT claims required; tenant ownership verified via surveyId lookup.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { SurveyQuestion, QuestionType } from '@/app/[tenant]/surveys/types'

const client = new Anthropic()

const PARSE_SYSTEM = `You are a survey parser. Extract questions from the provided document.
For each question return a JSON object with:
- id: a short unique key like "q1", "q2", etc.
- text: the question text exactly as written
- type: one of "likert5" (1-5 scale), "likert6" (1-6 scale), "rating" (1-10), "yesno", "text", "multichoice"
- section: section/group heading if present (omit if none)
- options: array of option strings if multichoice (omit otherwise)
- reverse_scored: true if the question is marked as reverse-scored or negatively worded (omit if not)

Return ONLY a JSON array of question objects, nothing else.`

export async function POST(req: NextRequest) {
  const claims = await getServerJWTClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const surveyId = formData.get('surveyId') as string | null
  const tenantSlug = formData.get('tenantSlug') as string | null

  if (!file || !surveyId || !tenantSlug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify survey belongs to tenant
  const supabase = createServiceClient()
  let tenantId = claims.tenant_id
  if (!tenantId) {
    const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
    tenantId = data?.id ?? null
  }
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })

  const { data: survey } = await supabase
    .from('surveys')
    .select('id')
    .eq('id', surveyId)
    .eq('tenant_id', tenantId)
    .single()
  if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 })

  // Read the file content
  const buffer = Buffer.from(await file.arrayBuffer())
  let textContent = ''

  const mimeType = file.type
  const fileName = file.name.toLowerCase()

  if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
    textContent = buffer.toString('utf-8')
  } else if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    // Use Claude's file-reading capability by sending as base64
    // For simplicity, extract text via a Claude vision pass
    const base64 = buffer.toString('base64')
    const extraction = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          } as any,
          { type: 'text', text: 'Extract all text content from this document verbatim.' },
        ],
      }],
    })
    textContent = extraction.content.map(b => (b as any).text ?? '').join('\n')
  } else {
    // DOCX and others — attempt plain text extraction
    textContent = buffer.toString('utf-8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
  }

  if (!textContent.trim()) {
    return NextResponse.json({ error: 'Could not extract text from file' }, { status: 422 })
  }

  // Parse with Claude
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8192,
    system: PARSE_SYSTEM,
    messages: [{
      role: 'user',
      content: textContent.slice(0, 50000), // cap at 50k chars
    }],
  })

  const rawText = response.content.map(b => (b as any).text ?? '').join('')

  let questions: SurveyQuestion[] = []
  try {
    // Strip any markdown code fences
    const cleaned = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      questions = parsed.map((q: any, i: number) => ({
        id: q.id ?? `q${i + 1}`,
        text: String(q.text ?? ''),
        type: (['likert5', 'likert6', 'rating', 'yesno', 'text', 'multichoice'].includes(q.type)
          ? q.type
          : 'likert5') as QuestionType,
        ...(q.section ? { section: String(q.section) } : {}),
        ...(q.reverse_scored ? { reverse_scored: true } : {}),
        ...(q.options && Array.isArray(q.options) ? { options: q.options.map(String) } : {}),
      }))
    }
  } catch (err) {
    return NextResponse.json({ error: 'Could not parse AI response as JSON', raw: rawText.slice(0, 500) }, { status: 422 })
  }

  // Store parsed questions on the survey (append to existing, or replace if empty)
  if (questions.length > 0) {
    const service = createServiceClient()
    const { data: existing } = await service
      .from('surveys')
      .select('questions')
      .eq('id', surveyId)
      .single()

    const existingQs: SurveyQuestion[] = existing?.questions ?? []
    const merged = existingQs.length === 0 ? questions : [...existingQs, ...questions]

    await service
      .from('surveys')
      .update({ questions: merged })
      .eq('id', surveyId)
  }

  return NextResponse.json({ questionCount: questions.length, questions })
}
