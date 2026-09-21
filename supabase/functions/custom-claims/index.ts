import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json()
    const userId = payload.user_id

    if (!userId) {
      return new Response(
        JSON.stringify({ claims: payload.claims }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const [ilResult, memberResult] = await Promise.all([
      supabase.from('il_admins').select('il_role').eq('user_id', userId).single(),
      supabase.from('tenant_members').select('tenant_id, role').eq('user_id', userId).eq('is_active', true).limit(1).single(),
    ])

    const isIlAdmin = !ilResult.error && !!ilResult.data
    const member = !memberResult.error ? memberResult.data : null

    const customClaims = {
      ...payload.claims,
      is_il_admin: isIlAdmin,
      il_role: isIlAdmin ? (ilResult.data?.il_role ?? '') : '',
      tenant_id: member?.tenant_id ?? '',
      role: member?.role ?? '',
    }

    return new Response(
      JSON.stringify({ claims: customClaims }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Custom claims hook error:', error)
    return new Response(
      JSON.stringify({ claims: {} }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
})
