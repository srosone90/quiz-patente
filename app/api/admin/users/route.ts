import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Crea client Supabase admin solo quando necessario
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
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
  if (!authHeader) {
    console.log('[verifyAdmin] No auth header')
    return false
  }

  const supabaseAdmin = getSupabaseAdmin()
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) {
    console.log('[verifyAdmin] Auth error:', error)
    return false
  }

  console.log('[verifyAdmin] Checking user:', user.id)

  // Prova prima con id, poi con user_id
  let profile = await supabaseAdmin
    .from('user_profiles')
    .select('role, id, user_id')
    .eq('id', user.id)
    .single()

  if (!profile.data) {
    console.log('[verifyAdmin] Try with user_id')
    profile = await supabaseAdmin
      .from('user_profiles')
      .select('role, id, user_id')
      .eq('user_id', user.id)
      .single()
  }

  console.log('[verifyAdmin] Profile found:', profile.data)
  return profile.data?.role === 'admin'
}

// PATCH: Modifica utente
export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request)
    if (!isAdmin) {
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
