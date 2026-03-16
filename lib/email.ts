import { Resend } from 'resend'

// Mittente delle email — assicurati che il dominio sia verificato su Resend
const FROM_EMAIL = 'PatentiApp <noreply@patentiapp.it>'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY non configurata')
  return new Resend(key)
}

export interface SchoolWelcomeEmailData {
  to: string
  schoolName: string
  adminEmail: string
  adminPassword: string
  codes: Array<{
    code: string
    licenseLabel: string
    quantity?: number
  }>
  loginUrl: string
}

/**
 * Invia l'email di benvenuto all'autoscuola dopo il pagamento completato.
 * Include le credenziali admin e tutti i codici acquistati.
 */
export async function sendSchoolWelcomeEmail(data: SchoolWelcomeEmailData) {
  const { to, schoolName, adminEmail, adminPassword, codes, loginUrl } = data

  // Raggruppa i codici in una tabella HTML
  const codesHtml = codes
    .map(
      c => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${c.licenseLabel}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:14px;letter-spacing:1px;">${c.code}</td>
      </tr>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <title>Benvenuto su PatentiApp</title>
</head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f9fafb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">PatentiApp</h1>
      <p style="color:#e0e7ff;margin:8px 0 0;font-size:15px;">Portale Autoscuole</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="color:#1f2937;font-size:20px;margin:0 0 8px;">Benvenuto, ${schoolName}! 🎉</h2>
      <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
        Il tuo abbonamento è attivo. Qui sotto trovi le credenziali per accedere al pannello di controllo della tua autoscuola e tutti i codici di accesso acquistati.
      </p>

      <!-- Credenziali admin -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#166534;margin:0 0 12px;font-size:16px;">🔐 Credenziali Amministratore</h3>
        <p style="margin:4px 0;color:#374151;"><strong>Email:</strong> ${adminEmail}</p>
        <p style="margin:4px 0;color:#374151;"><strong>Password temporanea:</strong> <code style="background:#dcfce7;padding:2px 8px;border-radius:4px;font-size:14px;">${adminPassword}</code></p>
        <p style="margin:12px 0 0;color:#6b7280;font-size:13px;">⚠️ Cambia la password al primo accesso.</p>
      </div>

      <!-- Codici accesso -->
      <h3 style="color:#1f2937;font-size:16px;margin:0 0 12px;">🎫 Codici di Accesso</h3>
      <p style="color:#6b7280;font-size:14px;margin:0 0 12px;">
        Distribuisci questi codici ai tuoi studenti. Ogni codice attiva un accesso premium di <strong>180 giorni</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;text-align:left;font-size:13px;color:#374151;border-bottom:2px solid #e5e7eb;">Tipo Patente</th>
            <th style="padding:10px 12px;text-align:left;font-size:13px;color:#374151;border-bottom:2px solid #e5e7eb;">Codice</th>
          </tr>
        </thead>
        <tbody>
          ${codesHtml}
        </tbody>
      </table>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0 16px;">
        <a href="${loginUrl}" 
           style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
          Accedi al Pannello Scuola
        </a>
      </div>

      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
        Hai bisogno di aiuto? Contattaci a <a href="mailto:support@patentiapp.it" style="color:#6366f1;">support@patentiapp.it</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        PatentiApp · Soluzione digitale per autoscuole
      </p>
    </div>
  </div>
</body>
</html>
`

  const { data: resendData, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Benvenuto su PatentiApp — I tuoi codici per ${schoolName}`,
    html,
  })

  if (error) {
    console.error('Errore invio email di benvenuto:', error)
    throw new Error(`Errore invio email: ${error.message}`)
  }

  return resendData
}
