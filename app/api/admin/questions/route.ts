import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase environment variables')
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
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
    const supabaseAdmin = getSupabaseAdmin()
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (error || !user) return false
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()
    return profile?.role === 'admin'
  } catch {
    return false
  }
}

// DELETE: elimina domande in blocco
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, accessToken } = body

    if (!await verifyAdminToken(accessToken)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids è richiesto' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Prima elimina le risposte collegate (evita FK constraint)
    await supabaseAdmin.from('quiz_answers').delete().in('question_id', ids)

    // Poi elimina le domande
    const { error } = await supabaseAdmin.from('questions').delete().in('id', ids)
    if (error) throw error

    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (error: any) {
    console.error('Errore bulk delete questions:', error)
    return NextResponse.json({ error: error.message || 'Errore eliminazione' }, { status: 500 })
  }
}

// PATCH: aggiorna license_type in blocco
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, license_type, accessToken } = body

    if (!await verifyAdminToken(accessToken)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids è richiesto' }, { status: 400 })
    }
    if (!license_type) {
      return NextResponse.json({ error: 'license_type è richiesto' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('questions')
      .update({ license_type })
      .in('id', ids)
    if (error) throw error

    return NextResponse.json({ success: true, updated: ids.length })
  } catch (error: any) {
    console.error('Errore bulk update questions:', error)
    return NextResponse.json({ error: error.message || 'Errore aggiornamento' }, { status: 500 })
  }
}
