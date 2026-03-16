import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Crea client Supabase admin solo quando necessario
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('[getSupabaseAdmin] URL:', supabaseUrl ? 'presente' : 'MANCANTE')
  console.log('[getSupabaseAdmin] Key:', supabaseKey ? 'presente' : 'MANCANTE')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[getSupabaseAdmin] Missing env vars!')
    throw new Error('Missing Supabase environment variables')
  }
  
  console.log('[getSupabaseAdmin] Creating client...')
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Verifica che il token sia di un utente admin
// Il token arriva nel body JSON (non nell'header, per evitare restrizioni browser su Headers.set)
async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return false

  try {
    // Decode JWT payload to extract sub (user ID)
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))
    const userId = payload.sub as string | undefined
    if (!userId) return false

    // Verify via PostgREST: inject user JWT → Supabase verifies signature server-side
    // If JWT is invalid/forged, PostgREST returns an error
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: profile, error } = await client
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) return false
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

    console.log('[PATCH] Updating user:', userId, 'with', updates)

    // Prova prima con id
    let result = await supabaseAdmin
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()

    // Se non trova niente, prova con user_id
    if (!result.data || result.data.length === 0) {
      console.log('[PATCH] Try with user_id')
      result = await supabaseAdmin
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
    }

    if (result.error) throw result.error
    if (!result.data || result.data.length === 0) {
      throw new Error('Utente non trovato')
    }

    console.log('[PATCH] Update successful:', result.data[0])

    return NextResponse.json({ 
      success: true, 
      user: result.data[0],
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

    console.log('[DELETE] Deleting user:', userId)

    // Prova prima con id
    let deleteResult = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId)
      .select()

    // Se non trova niente, prova con user_id
    if (!deleteResult.data || deleteResult.data.length === 0) {
      console.log('[DELETE] Try with user_id')
      deleteResult = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)
        .select()
    }

    if (deleteResult.error) throw deleteResult.error
    if (!deleteResult.data || deleteResult.data.length === 0) {
      throw new Error('Utente non trovato')
    }

    // Elimina l'utente dall'autenticazione
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (authError) {
      console.error('Errore eliminazione auth:', authError)
      // Continua comunque se il profilo è stato eliminato
    }

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
