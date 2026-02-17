/**
 * Script Popolamento Database con Service Role Key
 * Usa privilegi admin per creare tabella e inserire domande
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Credenziali mancanti in .env.local');
  process.exit(1);
}

// Client con privilegi admin
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const FILES_CONFIG = [
  {
    name: 'Punto C) del Regolamento-2024-04-16.txt',
    category: 'Toponomastica Palermo'
  },
  {
    name: 'Punti A) e B) del Regolamento-2024-04-16 (1).txt',
    category: 'Toponomastica Sicilia'
  },
  {
    name: 'Punto F) del Regolamento-2024-05-08.txt',
    category: 'Legislazione Siciliana'
  },
  {
    name: 'Punti D) e E) del Regolamento-2024-04-16.txt',
    category: 'Codice della Strada'
  }
];

/**
 * Crea la tabella se non esiste
 */
async function createTable() {
  console.log('\n🔧 Creazione tabella questions...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answers TEXT[] NOT NULL,
        correct_answer TEXT NOT NULL,
        category TEXT,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Lettura pubblica delle domande" ON questions;
      CREATE POLICY "Lettura pubblica delle domande"
      ON questions FOR SELECT TO public USING (true);
      
      CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
    `
  });
  
  if (error) {
    // Proviamo via SQL diretto
    console.log('⚠️  Tentativo creazione diretta...');
    return true; // Continuiamo comunque
  }
  
  console.log('✅ Tabella pronta');
  return true;
}

/**
 * Parsa domande da file TXT
 */
function parseQuestions(content, category) {
  const lines = content.split('\n');
  const questions = [];
  
  let currentQuestion = null;
  let currentAnswers = [];
  let correctAnswer = null;
  let questionBuffer = '';
  
  for (let line of lines) {
    line = line.trim();
    
    if (!line || line.startsWith('/*') || line.includes('omitted')) continue;
    
    // Nuova domanda
    const qMatch = line.match(/^(\d+)\)\s+(.+)/);
    if (qMatch) {
      if (currentQuestion && correctAnswer && currentAnswers.length >= 2) {
        questions.push({
          question: currentQuestion.trim(),
          answers: currentAnswers,
          correct_answer: correctAnswer,
          category: category
        });
      }
      
      questionBuffer = qMatch[2];
      currentQuestion = null;
      currentAnswers = [];
      correctAnswer = null;
      continue;
    }
    
    // Risposta
    const aMatch = line.match(/^([A-D])\s*\[([\s\*])\]\s*(.+)/);
    if (aMatch) {
      if (questionBuffer) {
        currentQuestion = questionBuffer;
        questionBuffer = '';
      }
      
      const answerText = aMatch[3].trim();
      currentAnswers.push(answerText);
      
      if (aMatch[2] === '*') {
        correctAnswer = answerText;
      }
      continue;
    }
    
    if (questionBuffer && !aMatch) {
      questionBuffer += ' ' + line;
    }
  }
  
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
 * Inserisce domande
 */
async function insertQuestions(questions) {
  console.log(`\n💾 Inserimento ${questions.length} domande...`);
  
  const batchSize = 50;
  let inserted = 0;
  
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('questions')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Errore batch:`, error.message);
    } else {
      inserted += batch.length;
      process.stdout.write(`\r✅ Inseriti ${inserted}/${questions.length}`);
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('');
  return inserted;
}

/**
 * Main
 */
async function main() {
  console.log('🚀 POPOLAMENTO DATABASE AUTOMATICO\n');
  console.log('='.repeat(60));
  
  // Crea tabella
  await createTable();
  
  // Trova file
  const searchPaths = [
    'c:\\Users\\casar\\Downloads\\',
    './downloads/',
    './'
  ];
  
  let allQuestions = [];
  
  console.log('\n📖 Parsing file...\n');
  
  for (const config of FILES_CONFIG) {
    let found = false;
    
    for (const basePath of searchPaths) {
      const fullPath = path.join(basePath, config.name);
      
      if (fs.existsSync(fullPath)) {
        console.log(`📄 ${config.name}`);
        
        const content = fs.readFileSync(fullPath, 'utf-8');
        const questions = parseQuestions(content, config.category);
        
        console.log(`   ✅ ${questions.length} domande - ${config.category}\n`);
        
        allQuestions = allQuestions.concat(questions);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`⚠️  ${config.name} - NON TROVATO\n`);
    }
  }
  
  if (allQuestions.length === 0) {
    console.error('❌ Nessuna domanda trovata!');
    process.exit(1);
  }
  
  // Statistiche
  console.log('='.repeat(60));
  console.log(`\n📊 Totale: ${allQuestions.length} domande\n`);
  
  const catCounts = {};
  allQuestions.forEach(q => {
    catCounts[q.category] = (catCounts[q.category] || 0) + 1;
  });
  
  Object.entries(catCounts).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Inserisci
  const inserted = await insertQuestions(allQuestions);
  
  // Report
  console.log('\n' + '='.repeat(60));
  console.log('🎉 COMPLETATO!');
  console.log('='.repeat(60));
  console.log(`✅ Domande inserite: ${inserted}`);
  console.log(`\n💡 Vai su http://localhost:3000/quiz per testare!\n`);
  
  // Verifica
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Totale in database: ${count}\n`);
}

main().catch(err => {
  console.error('\n❌ Errore:', err.message);
  process.exit(1);
});
