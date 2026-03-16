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

// Verifica che l'utente che fa la richiesta sia admin
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  const token = authHeader.slice(7)

  try {
    // Verify JWT by passing it explicitly to Supabase Auth (Supabase-recommended server pattern)
    const supabaseVerify = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: { user }, error } = await supabaseVerify.auth.getUser(token)
    if (error || !user) {
      console.log('[verifyAdmin] Auth error:', error)
      return false
    }

    // Check admin role via service-role client (bypasses RLS)
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('[verifyAdmin] user:', user.id, 'role:', profile?.role)
    return profile?.role === 'admin'
  } catch (err) {
    console.error('[verifyAdmin] Exception:', err)
    return false
  }
}

// PATCH: Modifica utente
export async function PATCH(request: NextRequest) {
  console.log('[PATCH] Request received')
  try {
    console.log('[PATCH] Calling verifyAdmin...')
    const isAdmin = await verifyAdmin(request)
    console.log('[PATCH] verifyAdmin result:', isAdmin)
    
    if (!isAdmin) {
      console.log('[PATCH] Unauthorized - returning 403')
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, updates } = body

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
    const isAdmin = await verifyAdmin(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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
    const isAdmin = await verifyAdmin(request)
    if (!isAdmin) {
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
