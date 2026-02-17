import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { score, correct, total, time_taken } = body

    // Qui puoi salvare i risultati nel database se l'utente è autenticato
    // Per ora restituiamo solo un successo
    
    return NextResponse.json({ 
      success: true,
      message: 'Risultato salvato' 
    })
  } catch (error: any) {
    console.error('Errore salvataggio risultati:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
