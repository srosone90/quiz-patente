import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false
  try {
    const cleanToken = token.trim()
    const parts = cleanToken.split('.')
    if (parts.length !== 3) return false
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))
    if (payload.role === 'service_role' || payload.role === 'anon') return false
    const userId = payload.sub as string | undefined
    const exp = payload.exp as number | undefined
    if (!userId) return false
    if (exp && Math.floor(Date.now() / 1000) > exp) return false
    const db = getSupabaseAdmin()
    const { data: { user }, error } = await db.auth.admin.getUserById(userId)
    if (error || !user) return false
    const { data: profile } = await db.from('user_profiles').select('role').eq('id', userId).single()
    return profile?.role === 'admin'
  } catch {
    return false
  }
}

// POST: Genera un codice di accesso (server-side, bypassa RLS)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schoolName, planType, durationDays, maxUses, expiresAt, schoolId, licenseType, accessToken } = body

    if (!await verifyAdminToken(accessToken)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    if (!schoolName || !planType || !durationDays) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    // Recupera l'userId dal token per created_by
    const parts = accessToken.trim().split('.')
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'))
    const createdBy = payload.sub as string

    const code = `${(planType as string).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    const { data, error } = await db
      .from('access_codes')
      .insert([{
        code,
        school_name: schoolName,
        plan_type: planType,
        duration_days: durationDays,
        max_uses: maxUses ?? 1,
        created_by: createdBy,
        expires_at: expiresAt ?? null,
        school_id: schoolId ?? null,
        license_type: licenseType ?? null,
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, code, data })
  } catch (error: any) {
    console.error('Errore generazione codice:', error)
    return NextResponse.json({ error: error.message || 'Errore generazione codice' }, { status: 500 })
  }
}
