/**
 * Script per importare domande dai file TXT nel database Supabase
 * 
 * ISTRUZIONI:
 * 1. Assicurati di avere i file TXT nella cartella del progetto
 * 2. Configura .env.local con le credenziali Supabase
 * 3. Esegui: node import-questions.js
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configurazione Supabase (prende da .env.local)
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Errore: Configurare NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mappa categorie dai nomi file
const categoryMap = {
  'Punto C': 'Toponomastica Palermo',
  'Punti A) e B)': 'Toponomastica Sicilia',
  'Punto F)': 'Legislazione Siciliana',
  'Punti D) e E)': 'Codice della Strada / Normativa Nazionale'
};

/**
 * Parsa un file TXT e estrae le domande
 */
function parseQuestionsFile(filePath, category) {
  console.log(`\n📖 Parsing file: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const questions = [];
  let currentQuestion = null;
  let currentAnswers = [];
  let correctAnswer = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Salta linee vuote o commenti
    if (!line || line.startsWith('/*') || line.startsWith('*/')) continue;
    
    // Detect nuova domanda (inizia con numero)
    const questionMatch = line.match(/^(\d+)\)\s+(.+)/);
    if (questionMatch) {
      // Salva domanda precedente se esiste
      if (currentQuestion && correctAnswer) {
        questions.push({
          question: currentQuestion,
          answers: currentAnswers,
          correct_answer: correctAnswer,
          category: category
        });
      }
      
      // Nuova domanda
      currentQuestion = questionMatch[2];
      currentAnswers = [];
      correctAnswer = null;
      continue;
    }
    
    // Detect risposta
    const answerMatch = line.match(/^[ABC]\s+\[([\s\*])\]\s+(.+)/);
    if (answerMatch && currentQuestion) {
      const isCorrect = answerMatch[1] === '*';
      const answerText = answerMatch[2];
      
      currentAnswers.push(answerText);
      
      if (isCorrect) {
        correctAnswer = answerText;
      }
    }
  }
  
  // Salva ultima domanda
  if (currentQuestion && correctAnswer) {
    questions.push({
      question: currentQuestion,
      answers: currentAnswers,
      correct_answer: correctAnswer,
      category: category
    });
  }
  
  console.log(`✅ Trovate ${questions.length} domande`);
  return questions;
}

/**
 * Inserisce le domande nel database
 */
async function insertQuestions(questions) {
  console.log(`\n💾 Inserimento di ${questions.length} domande nel database...`);
  
  const batchSize = 50;
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
      console.log(`✅ Inseriti ${inserted}/${questions.length}`);
    }
  }
  
  return { inserted, errors };
}

/**
 * Script principale
 */
async function main() {
  console.log('🚀 Inizio importazione domande...\n');
  
  // File da importare (aggiorna i path se necessario)
  const files = [
    {
      path: './Punto C) del Regolamento-2024-04-16.txt',
      category: categoryMap['Punto C']
    },
    {
      path: './Punti A) e B) del Regolamento-2024-04-16 (1).txt',
      category: categoryMap['Punti A) e B)']
    },
    {
      path: './Punto F) del Regolamento-2024-05-08.txt',
      category: categoryMap['Punto F)']
    },
    {
      path: './Punti D) e E) del Regolamento-2024-04-16.txt',
      category: categoryMap['Punti D) e E)']
    }
  ];
  
  let allQuestions = [];
  
  // Parsa tutti i file
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      const questions = parseQuestionsFile(file.path, file.category);
      allQuestions = allQuestions.concat(questions);
    } else {
      console.log(`⚠️  File non trovato: ${file.path}`);
    }
  }
  
  if (allQuestions.length === 0) {
    console.error('\n❌ Nessuna domanda trovata! Verifica che i file TXT siano nella cartella corretta.');
    process.exit(1);
  }
  
  console.log(`\n📊 Totale domande da importare: ${allQuestions.length}`);
  console.log('\nCategorie:');
  const categoryCounts = allQuestions.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count} domande`);
  });
  
  // Conferma prima di procedere
  console.log('\n⚠️  Vuoi procedere con l\'importazione? (Ctrl+C per annullare)');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Inserisci nel database
  const { inserted, errors } = await insertQuestions(allQuestions);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ IMPORTAZIONE COMPLETATA!');
  console.log('='.repeat(50));
  console.log(`✅ Domande inserite: ${inserted}`);
  console.log(`❌ Errori: ${errors}`);
  console.log('\n🎉 Puoi ora usare il sito su http://localhost:3000\n');
}

// Esegui
main().catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});
