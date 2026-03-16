import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { B2B_PLAN_TYPE, B2B_CODE_DURATION_DAYS, B2B_LICENSE_PRICING } from '@/lib/pricing'
import { sendSchoolWelcomeEmail } from '@/lib/email'

// Service role client — bypassa RLS, usato solo server-side nel webhook
function getServiceClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !key) throw new Error('Variabili Supabase non configurate')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

/** Genera un codice di accesso (server-side, senza utente autenticato) */
function buildCodeString(planType: string): string {
  return `${planType.toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
}

async function handleSchoolOnboarding(session: any) {
  const meta = session.metadata as Record<string, string>
  const { schoolName, schoolEmail, schoolCity, schoolAddress, schoolPhone, orders: ordersRaw } = meta

  let orderItems: Array<{ licenseId: string; quantity: number }>
  try {
    orderItems = JSON.parse(ordersRaw)
  } catch {
    throw new Error('Impossibile decodificare orders dalla metadata Stripe')
  }

  const db = getServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://patentiapp.it'

  // 1. Crea la scuola nel DB
  const { data: school, error: schoolErr } = await db
    .from('schools')
    .insert([{ name: schoolName, city: schoolCity, address: schoolAddress, phone: schoolPhone, email: schoolEmail, is_active: true }])
    .select()
    .single()

  if (schoolErr || !school) throw new Error(`Errore creazione scuola: ${schoolErr?.message}`)
  console.log(`Scuola creata: ${school.id} — ${schoolName}`)

  // 2. Abilita le licenze acquistate nella tabella school_licenses (se esiste)
  const licenseIds = [...new Set(orderItems.map(i => i.licenseId))]
  const { error: licErr } = await db
    .from('school_licenses')
    .upsert(licenseIds.map(id => ({ school_id: school.id, license_type: id, is_enabled: true })))
  if (licErr) console.warn('school_licenses upsert warning:', licErr.message)

  // 3. Crea l'utente admin per la scuola
  const tempPassword = `Scuola-${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  const { data: authData, error: authErr } = await db.auth.admin.createUser({
    email: schoolEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: schoolName, role: 'school_admin', school_id: school.id },
  })

  if (authErr) throw new Error(`Errore creazione utente admin: ${authErr.message}`)
  const adminUserId = authData.user.id
  console.log(`Admin creato: ${adminUserId} — ${schoolEmail}`)

  // 4. Aggiorna il profilo utente con ruolo school_admin e school_id
  await db
    .from('profiles')
    .upsert([{ id: adminUserId, full_name: schoolName, role: 'school_admin', school_id: school.id, subscription_type: 'free' }])

  // 5. Genera tutti i codici di accesso
  const expiresAt = new Date(Date.now() + B2B_CODE_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const generatedCodes: Array<{ code: string; licenseLabel: string }> = []

  for (const item of orderItems) {
    const license = B2B_LICENSE_PRICING.find(l => l.id === item.licenseId)
    const licenseLabel = license?.label ?? item.licenseId

    for (let i = 0; i < item.quantity; i++) {
      const code = buildCodeString(B2B_PLAN_TYPE)
      const { error: codeErr } = await db
        .from('access_codes')
        .insert([{
          code,
          school_name: schoolName,
          plan_type: B2B_PLAN_TYPE,
          duration_days: B2B_CODE_DURATION_DAYS,
          max_uses: 1,
          created_by: adminUserId,
          expires_at: expiresAt,
          school_id: school.id,
          license_type: item.licenseId,
          is_active: true,
        }])
      if (codeErr) console.error(`Errore codice ${code}:`, codeErr.message)
      else generatedCodes.push({ code, licenseLabel })
    }
  }

  console.log(`Generati ${generatedCodes.length} codici per ${schoolName}`)

  // 6. Invia email di benvenuto con credenziali e codici
  await sendSchoolWelcomeEmail({
    to: schoolEmail,
    schoolName,
    adminEmail: schoolEmail,
    adminPassword: tempPassword,
    codes: generatedCodes,
    loginUrl: `${appUrl}/login`,
  })

  console.log(`Email di benvenuto inviata a ${schoolEmail}`)
}

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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const metadata = session.metadata as Record<string, string> | null

      console.log('checkout.session.completed:', { sessionId: session.id, type: metadata?.type })

      if (metadata?.type === 'school_onboarding') {
        // Flusso B2B: crea scuola + admin + codici + email
        await handleSchoolOnboarding(session)
      } else {
        // Flusso B2C esistente: attiva abbonamento studente
        const customerEmail = session.customer_email
        if (customerEmail) {
          const db = getServiceClient()
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = db as any
          const { data: prof } = await raw.from('profiles').select('id').eq('email', customerEmail).maybeSingle()
          if (prof?.id) {
            await raw.from('profiles').update({ subscription_type: 'senza_pensieri', subscription_expires_at: expiresAt }).eq('id', prof.id)
            console.log(`Abbonamento attivato per: ${customerEmail}`)
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Errore webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
