import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const plan = searchParams.get('plan') || 'free'
    const limit = plan === 'free' ? 10 : 20

    // Carica domande dal database Supabase
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .limit(1000) // Prendi tutte le domande disponibili

    if (error) {
      console.error('Errore Supabase:', error)
      return NextResponse.json({ 
        questions: [], 
        fallback: true,
        error: 'Database non configurato o vuoto'
      })
    }

    // Se non ci sono domande nel database
    if (!questions || questions.length === 0) {
      return NextResponse.json({ 
        questions: [], 
        fallback: true,
        error: 'Nessuna domanda disponibile nel database'
      })
    }

    // Mescola le domande e prendi solo il numero richiesto
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    const selectedQuestions = shuffled.slice(0, Math.min(limit, questions.length))

    return NextResponse.json({
      questions: selectedQuestions,
      fallback: false,
      total: questions.length
    })
  } catch (error) {
    console.error('Errore API quiz:', error)
    return NextResponse.json({ 
      questions: [], 
      fallback: true,
      error: 'Errore durante il caricamento delle domande'
    })
  }
}
