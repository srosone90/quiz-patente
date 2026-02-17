/**
 * Script Avanzato per Importazione Domande
 * Parsa i file TXT e inserisce le domande nel database Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carica variabili ambiente
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Errore: Configurare credenziali Supabase in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mappa categorie
const FILES_CONFIG = [
  {
    name: 'Punto C) del Regolamento-2024-04-16.txt',
    category: 'Toponomastica Palermo',
    path: './downloads/'
  },
  {
    name: 'Punti A) e B) del Regolamento-2024-04-16 (1).txt',
    category: 'Toponomastica Sicilia',
    path: './downloads/'
  },
  {
    name: 'Punto F) del Regolamento-2024-05-08.txt',
    category: 'Legislazione Siciliana',
    path: './downloads/'
  },
  {
    name: 'Punti D) e E) del Regolamento-2024-04-16.txt',
    category: 'Codice della Strada',
    path: './downloads/'
  }
];

/**
 * Parsa un file TXT e estrae le domande
 */
function parseQuestions(content, category) {
  const lines = content.split('\n');
  const questions = [];
  
  let currentQuestion = null;
  let currentAnswers = [];
  let correctAnswer = null;
  let questionBuffer = '';
  let isReadingQuestion = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Salta linee vuote o commenti
    if (!line || line.startsWith('/*') || line.startsWith('*/') || line.includes('Lines') && line.includes('omitted')) {
      continue;
    }
    
    // Detect nuova domanda (inizia con numero seguito da parentesi)
    const questionMatch = line.match(/^(\d+)\)\s+(.+)/);
    if (questionMatch) {
      // Salva domanda precedente se esiste
      if (currentQuestion && correctAnswer && currentAnswers.length >= 2) {
        questions.push({
          question: currentQuestion.trim(),
          answers: currentAnswers,
          correct_answer: correctAnswer,
          category: category
        });
      }
      
      // Inizia nuova domanda
      questionBuffer = questionMatch[2];
      isReadingQuestion = true;
      currentQuestion = null;
      currentAnswers = [];
      correctAnswer = null;
      continue;
    }
    
    // Detect risposta (A, B, C, D con [ ] o [*])
    const answerMatch = line.match(/^([A-D])\s*\[([\s\*])\]\s*(.+)/);
    if (answerMatch) {
      // Finalizza la domanda se stavamo leggendo
      if (isReadingQuestion && questionBuffer) {
        currentQuestion = questionBuffer;
        isReadingQuestion = false;
      }
      
      const isCorrect = answerMatch[2] === '*';
      const answerText = answerMatch[3].trim();
      
      currentAnswers.push(answerText);
      
      if (isCorrect) {
        correctAnswer = answerText;
      }
      continue;
    }
    
    // Se stiamo leggendo una domanda multi-linea
    if (isReadingQuestion && !answerMatch) {
      questionBuffer += ' ' + line;
    }
  }
  
  // Salva ultima domanda
  if (currentQuestion && correctAnswer && currentAnswers.length >= 2) {
    questions.push({
      question: currentQuestion.trim(),
      answers: currentAnswers,
      correct_answer: correctAnswer,
      category: category
    });
  }
  
  return questions;
}

/**
 * Inserisce domande nel database
 */
async function insertQuestions(questions) {
  console.log(`\n💾 Inserimento di ${questions.length} domande...`);
  
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('questions')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Errore batch ${i}-${i + batch.length}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write(`\r✅ Inseriti ${inserted}/${questions.length}`);
    }
  }
  
  console.log('');
  return { inserted, errors };
}

/**
 * Verifica se la tabella esiste e ha dati
 */
async function checkDatabase() {
  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Errore connessione database:', error.message);
    return null;
  }
  
  return count;
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Import Domande - Quiz Ruolo Conducenti\n');
  console.log('='.repeat(50));
  
  // Verifica database
  console.log('\n📊 Verifica database...');
  const currentCount = await checkDatabase();
  
  if (currentCount === null) {
    console.error('\n❌ Impossibile connettersi al database!');
    console.log('\nVerifica:');
    console.log('1. Credenziali Supabase in .env.local');
    console.log('2. Tabella "questions" creata (esegui supabase-setup.sql)');
    console.log('3. Policy RLS configurata\n');
    process.exit(1);
  }
  
  console.log(`✅ Database connesso - Domande esistenti: ${currentCount}`);
  
  if (currentCount > 0) {
    console.log('\n⚠️  ATTENZIONE: Il database contiene già domande!');
    console.log('Continua per aggiungerne altre...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Cerca file nella cartella downloads
  const downloadsPaths = [
    'c:\\Users\\casar\\Downloads\\',
    './downloads/',
    './'
  ];
  
  let allQuestions = [];
  let filesFound = 0;
  
  console.log('\n📖 Ricerca e parsing file...\n');
  
  for (const fileConfig of FILES_CONFIG) {
    let fileFound = false;
    
    for (const basePath of downloadsPaths) {
      const fullPath = path.join(basePath, fileConfig.name);
      
      if (fs.existsSync(fullPath)) {
        console.log(`📄 ${fileConfig.name}`);
        console.log(`   Categoria: ${fileConfig.category}`);
        
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const questions = parseQuestions(content, fileConfig.category);
          
          console.log(`   ✅ ${questions.length} domande estratte\n`);
          
          allQuestions = allQuestions.concat(questions);
          filesFound++;
          fileFound = true;
          break;
        } catch (error) {
          console.error(`   ❌ Errore lettura: ${error.message}\n`);
        }
      }
    }
    
    if (!fileFound) {
      console.log(`⚠️  ${fileConfig.name} - NON TROVATO`);
      console.log(`   Cerca in: ${downloadsPaths.join(', ')}\n`);
    }
  }
  
  if (filesFound === 0) {
    console.error('\n❌ Nessun file trovato!');
    console.log('\nSoluzioni:');
    console.log('1. Sposta i file TXT in: c:\\Users\\casar\\Downloads\\');
    console.log('2. Oppure nella cartella del progetto');
    console.log('3. Verifica i nomi dei file siano esatti\n');
    process.exit(1);
  }
  
  if (allQuestions.length === 0) {
    console.error('\n❌ Nessuna domanda estratta!');
    console.log('Verifica il formato dei file TXT\n');
    process.exit(1);
  }
  
  // Statistiche
  console.log('='.repeat(50));
  console.log(`\n📊 RIEPILOGO`);
  console.log(`   File processati: ${filesFound}/${FILES_CONFIG.length}`);
  console.log(`   Domande totali: ${allQuestions.length}`);
  console.log('\n   Per categoria:');
  
  const categoryCounts = allQuestions.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(`   - ${cat}: ${count}`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('\n⏳ Inizio importazione in 3 secondi...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Inserisci nel database
  const { inserted, errors } = await insertQuestions(allQuestions);
  
  // Report finale
  console.log('\n' + '='.repeat(50));
  console.log('✅ IMPORTAZIONE COMPLETATA!');
  console.log('='.repeat(50));
  console.log(`✅ Domande inserite: ${inserted}`);
  console.log(`❌ Errori: ${errors}`);
  
  const finalCount = await checkDatabase();
  console.log(`📊 Totale domande nel database: ${finalCount}`);
  
  console.log('\n🎉 Puoi ora usare il quiz su http://localhost:3000/quiz\n');
}

// Esegui
main().catch(error => {
  console.error('\n❌ Errore fatale:', error.message);
  process.exit(1);
});
