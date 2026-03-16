import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { B2B_AVAILABLE_LICENSES, B2B_MIN_CODES, calculateOrderTotal } from '@/lib/pricing'

interface OrderItem {
  licenseId: string
  quantity: number
}

interface SchoolForm {
  schoolName: string
  city?: string
  address?: string
  phone?: string
  email: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { form, orderItems } = body as { form: SchoolForm; orderItems: OrderItem[] }

    // Validazione input
    if (!form?.schoolName?.trim() || !form?.email?.trim()) {
      return NextResponse.json({ error: 'Nome autoscuola ed email sono obbligatori.' }, { status: 400 })
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json({ error: 'Seleziona almeno una patente.' }, { status: 400 })
    }

    // Verifica che le licenze siano tutte valide e non in beta
    const validLicenseIds = new Set(B2B_AVAILABLE_LICENSES.map(l => l.id))
    for (const item of orderItems) {
      if (!validLicenseIds.has(item.licenseId)) {
        return NextResponse.json({ error: `Tipo di licenza non valido: ${item.licenseId}` }, { status: 400 })
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ error: 'Quantità non valida.' }, { status: 400 })
      }
    }

    const totalCodes = orderItems.reduce((s, i) => s + i.quantity, 0)
    if (totalCodes < B2B_MIN_CODES) {
      return NextResponse.json(
        { error: `Minimo ${B2B_MIN_CODES} codici per ordine.` },
        { status: 400 }
      )
    }

    const total = calculateOrderTotal(orderItems)
    if (total <= 0) {
      return NextResponse.json({ error: 'Totale non valido.' }, { status: 400 })
    }

    // Costruisci le line items per Stripe
    const lineItems = orderItems.map(item => {
      const license = B2B_AVAILABLE_LICENSES.find(l => l.id === item.licenseId)!
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `PatentiApp — ${license.label}`,
            description: `${item.quantity} codice/i di accesso · Validità 180 giorni`,
          },
          unit_amount: Math.round(license.pricePerCode * 100),
        },
        quantity: item.quantity,
      }
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://patentiapp.it'

    // Crea sessione di checkout Stripe con i dati scuola nei metadata
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: form.email,
      metadata: {
        type: 'school_onboarding',
        schoolName: form.schoolName.trim(),
        schoolEmail: form.email.trim(),
        schoolCity: form.city?.trim() || '',
        schoolAddress: form.address?.trim() || '',
        schoolPhone: form.phone?.trim() || '',
        // Codifica gli ordini come JSON (limite 500 chars per valore in Stripe metadata)
        orders: JSON.stringify(orderItems),
      },
      success_url: `${appUrl}/autoscuole/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/autoscuole`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Errore creazione checkout scuola:', err)
    return NextResponse.json({ error: 'Errore interno del server.' }, { status: 500 })
  }
}
