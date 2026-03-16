import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Crea client Supabase admin solo quando necessario
// IMPORTANT: .trim() is required — Vercel env vars can have trailing/leading newlines
// which cause Node.js fetch to throw "Headers.set: invalid header value"
function getSupabaseAdmin() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Verifica che il token sia di un utente admin
// Approccio: decode JWT payload localmente per estrarre user ID,
// poi verifica con service-role admin API (nessun header JWT coinvolto)
async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false

  try {
    // Trim in case the env var or stored value has leading/trailing newlines
    const cleanToken = token.trim()

    // Decode JWT payload
    const parts = cleanToken.split('.')
    if (parts.length !== 3) return false
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))

    // Reject service-role keys — they have role='service_role' instead of sub
    if (payload.role === 'service_role' || payload.role === 'anon') return false

    const userId = payload.sub as string | undefined
    const exp = payload.exp as number | undefined
    if (!userId) return false
    if (exp && Math.floor(Date.now() / 1000) > exp) return false

    // getSupabaseAdmin() now trims keys — HTTP requests will succeed even if
    // the Vercel env var had a leading/trailing newline
    const supabaseAdmin = getSupabaseAdmin()

    // Verify user exists in Supabase Auth (prevents forged sub claims)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (authError || !user) return false

    // Check admin role in user_profiles
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

// PATCH: Modifica utente
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, updates, accessToken } = body

    if (!await verifyAdminToken(accessToken)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'userId e updates sono richiesti' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // With service role, update succeeds silently (data may be empty) — only check for errors
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)

    if (updateError) throw updateError

    return NextResponse.json({ 
      success: true, 
      message: 'Utente aggiornato con successo'
    })

  } catch (error: any) {
    console.error('Errore modifica utente:', error)
    return NextResponse.json(
      { error: error.message || 'Errore durante la modifica' },
      { status: 500 }
    )
  }
}

// DELETE: Elimina utente
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, accessToken } = body

    if (!await verifyAdminToken(accessToken)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId è richiesto' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Delete profile row — only check for errors, not returned data (service role quirk)
    const { error: deleteError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (deleteError) throw deleteError

    // Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) console.error('Errore eliminazione auth:', authError)

    return NextResponse.json({ 
      success: true,
      message: 'Utente eliminato con successo'
    })

  } catch (error: any) {
    console.error('Errore eliminazione utente:', error)
    return NextResponse.json(
      { error: error.message || 'Errore durante l\'eliminazione' },
      { status: 500 }
    )
  }
}

// GET: Lista tutti gli utenti (bypassa RLS con service role key)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('accessToken') || ''
    if (!await verifyAdminToken(accessToken)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ users: data || [] })
  } catch (error: any) {
    console.error('Errore lista utenti:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
