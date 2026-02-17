import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('Webhook secret non configurato')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: any) {
      console.error('Errore verifica webhook:', err.message)
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    // Gestisci l'evento di pagamento completato
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any

      // Qui puoi salvare l'abbonamento nel database
      // Per ora loggiamo solo l'evento
      console.log('Pagamento completato:', {
        sessionId: session.id,
        customerEmail: session.customer_email,
        amount: session.amount_total,
      })

      // TODO: Attiva l'abbonamento nel database
      // const { data, error } = await supabase
      //   .from('profiles')
      //   .update({ 
      //     subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      //   })
      //   .eq('email', session.customer_email)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Errore webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
