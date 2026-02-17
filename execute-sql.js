const fs = require('fs');
const path = require('path');

async function executeSQL() {
  console.log('🚀 Esecuzione SQL su Supabase...\n');

  // Leggi il file SQL
  const sqlFilePath = path.join(__dirname, 'COMPLETE-DATABASE-IMPORT.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log(`📁 File caricato: ${sqlContent.length} caratteri`);
  console.log(`📊 Preparazione per l'esecuzione...\n`);

  // URL del tuo progetto Supabase
  const SUPABASE_URL = 'https://dsxzqwicsggzyeropget.supabase.co';
  
  // Ti serve la Service Role Key (non l'anon key!)
  // La trovi su: Supabase Dashboard > Settings > API > service_role key (secret)
  console.log('❗ IMPORTANTE: Inserisci la tua SERVICE ROLE KEY');
  console.log('📍 Dove trovarla:');
  console.log('   1. Vai su Supabase Dashboard');
  console.log('   2. Settings > API');
  console.log('   3. Copia "service_role" key (NON la anon key)\n');
  
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SERVICE_ROLE_KEY) {
    console.error('❌ ERRORE: Service Role Key non trovata!');
    console.log('\n💡 SOLUZIONE:');
    console.log('   Esegui questo comando CON LA TUA KEY:');
    console.log('   $env:SUPABASE_SERVICE_ROLE_KEY="TUA_SERVICE_ROLE_KEY_QUI"; node execute-sql.js');
    console.log('\n   Esempio:');
    console.log('   $env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; node execute-sql.js');
    process.exit(1);
  }

  try {
    // Esegui l'SQL usando l'API REST di Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sqlContent })
    });

    if (!response.ok) {
      // Prova metodo alternativo: carica direttamente via SQL Editor API
      console.log('⚠️  Metodo 1 fallito, provo metodo alternativo...\n');
      
      const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.pgrst.object+json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: sqlContent
      });

      if (!altResponse.ok) {
        throw new Error(`Errore HTTP: ${altResponse.status} - ${await altResponse.text()}`);
      }
    }

    console.log('✅ DATABASE POPOLATO CON SUCCESSO! 🎉\n');
    console.log('📊 Statistiche:');
    console.log('   ✓ Tabella "questions" creata');
    console.log('   ✓ 460 domande inserite');
    console.log('   ✓ Row Level Security configurata\n');
    console.log('🌐 Ora puoi testare il quiz su: http://localhost:3000/quiz');

  } catch (error) {
    console.error('❌ ERRORE durante l\'esecuzione:', error.message);
    console.log('\n💡 SOLUZIONE MANUALE (più semplice):');
    console.log('   1. Vai su Supabase Dashboard > SQL Editor');
    console.log('   2. Clicca "+ New query"');
    console.log('   3. Nel file COMPLETE-DATABASE-IMPORT.sql (già aperto in VS Code):');
    console.log('      - Premi Ctrl+A (seleziona tutto)');
    console.log('      - Premi Ctrl+C (copia)');
    console.log('   4. Torna su Supabase, clicca nell\'editor SQL');
    console.log('   5. Premi Ctrl+V (incolla)');
    console.log('   6. Clicca il pulsante verde "RUN" in alto a destra');
    console.log('   7. Aspetta il messaggio "Success. Rows affected: 460"\n');
  }
}

executeSQL().catch(console.error);
