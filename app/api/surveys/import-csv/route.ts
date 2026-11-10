/**
 * POST /api/surveys/import-csv
 *
 * Accepts a CSV file with survey response data.
 *
 * Expected CSV format:
 *   name, email, q1, q2, q3, ...
 *   (header row with question IDs as column names)
 *   (name and email columns are optional)
 *
 * Returns: { inserted: number }
 *
 * Auth: JWT claims required; tenant ownership verified.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows: Array<Record<string, string>> = []

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? ''
    })
    rows.push(row)
  }

  return rows
}

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

  // Verify survey ownership
  const supabase = createServiceClient()
  let tenantId = claims.tenant_id
  if (!tenantId) {
    const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
    tenantId = data?.id ?? null
  }
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })

  const { data: survey } = await supabase
    .from('surveys')
    .select('id, questions')
    .eq('id', surveyId)
    .eq('tenant_id', tenantId)
    .single()
  if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 })

  // Parse CSV
  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data rows found in CSV' }, { status: 422 })
  }

  // Get valid question IDs from the survey
  const validQIds = new Set((survey.questions ?? []).map((q: any) => q.id as string))

  // Build response records
  const records = rows
    .filter(row => Object.keys(row).some(k => validQIds.has(k) && row[k] !== ''))
    .map(row => {
      const name = row['name'] || row['respondent_name'] || null
      const email = row['email'] || row['respondent_email'] || null

      // Extract only question-ID columns
      const data: Record<string, string> = {}
      for (const [k, v] of Object.entries(row)) {
        if (validQIds.has(k) && v !== '') {
          data[k] = v
        }
      }

      return {
        survey_id: surveyId,
        respondent_name: name,
        respondent_email: email,
        data,
      }
    })
    .filter(r => Object.keys(r.data).length > 0)

  if (records.length === 0) {
    return NextResponse.json({ error: 'No valid response data found. Ensure column headers match question IDs.' }, { status: 422 })
  }

  const service = createServiceClient()
  const { data: inserted, error } = await service
    .from('survey_responses')
    .insert(records)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ inserted: inserted?.length ?? 0 })
}
