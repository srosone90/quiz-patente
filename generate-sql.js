/**
 * Genera file SQL completo con tutte le domande
 */

const fs = require('fs');
const path = require('path');

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

function parseQuestions(content, category) {
  const lines = content.split('\n');
  const questions = [];
  
  let currentQuestion = null;
  let currentAnswers = [];
  let correctAnswer = null;
  let questionBuffer = '';
  let answerBuffer = '';
  let isCorrectAnswer = false;
  
  for (let line of lines) {
    line = line.trim();
    
    if (!line || line.startsWith('/*') || line.includes('omitted')) continue;
    
    // Nuova domanda
    const qMatch = line.match(/^(\d+)\)\s+(.+)/);
    if (qMatch) {
      // Salva risposta precedente se esiste
      if (answerBuffer) {
        currentAnswers.push(answerBuffer.trim());
        if (isCorrectAnswer) {
          correctAnswer = answerBuffer.trim();
        }
        answerBuffer = '';
        isCorrectAnswer = false;
      }
      
      // Salva domanda precedente
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
    
    // Nuova risposta
    const aMatch = line.match(/^([A-D])\s*\[([\s\*])\]\s*(.+)/);
    if (aMatch) {
      // Salva risposta precedente se esiste
      if (answerBuffer) {
        currentAnswers.push(answerBuffer.trim());
        if (isCorrectAnswer) {
          correctAnswer = answerBuffer.trim();
        }
      }
      
      // Salva domanda se c'era nel buffer
      if (questionBuffer) {
        currentQuestion = questionBuffer;
        questionBuffer = '';
      }
      
      // Inizia nuova risposta
      answerBuffer = aMatch[3];
      isCorrectAnswer = (aMatch[2] === '*');
      continue;
    }
    
    // Continua risposta corrente
    if (answerBuffer && !qMatch) {
      answerBuffer += ' ' + line;
      continue;
    }
    
    // Continua domanda corrente
    if (questionBuffer && !aMatch) {
      questionBuffer += ' ' + line;
    }
  }
  
  // Salva ultima risposta
  if (answerBuffer) {
    currentAnswers.push(answerBuffer.trim());
    if (isCorrectAnswer) {
      correctAnswer = answerBuffer.trim();
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

function escapeSQL(str) {
  return str.replace(/'/g, "''");
}

function generateSQL(questions) {
  let sql = `-- ============================================
-- SETUP COMPLETO DATABASE
-- Quiz Ruolo Conducenti - ${questions.length} Domande
-- ============================================

-- 1. Crea la tabella
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

-- 2. Abilita Row Level Security
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 3. Policy per lettura pubblica
DROP POLICY IF EXISTS "Lettura pubblica delle domande" ON questions;
CREATE POLICY "Lettura pubblica delle domande"
ON questions FOR SELECT TO public USING (true);

-- 4. Indici per performance
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);

-- ============================================
-- INSERIMENTO DOMANDE (${questions.length} totali)
-- ============================================

`;

  // Raggruppa per categoria
  const byCategory = {};
  questions.forEach(q => {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push(q);
  });

  Object.entries(byCategory).forEach(([category, catQuestions]) => {
    sql += `\n-- ${category.toUpperCase()} (${catQuestions.length} domande)\n`;
    sql += `INSERT INTO questions (question, answers, correct_answer, category) VALUES\n`;
    
    catQuestions.forEach((q, idx) => {
      const question = escapeSQL(q.question);
      const answers = q.answers.map(a => `'${escapeSQL(a)}'`).join(', ');
      const correctAnswer = escapeSQL(q.correct_answer);
      const category = escapeSQL(q.category);
      
      sql += `  ('${question}', ARRAY[${answers}], '${correctAnswer}', '${category}')`;
      sql += idx < catQuestions.length - 1 ? ',\n' : ';\n';
    });
  });

  sql += `\n-- ============================================
-- VERIFICA
-- ============================================
SELECT category, COUNT(*) as count 
FROM questions 
GROUP BY category 
ORDER BY category;

SELECT COUNT(*) as total_questions FROM questions;
`;

  return sql;
}

async function main() {
  console.log('🚀 Generazione SQL completo...\n');
  
  const searchPaths = [
    'c:\\Users\\casar\\Downloads\\',
    './downloads/',
    './'
  ];
  
  let allQuestions = [];
  
  for (const config of FILES_CONFIG) {
    let found = false;
    
    for (const basePath of searchPaths) {
      const fullPath = path.join(basePath, config.name);
      
      if (fs.existsSync(fullPath)) {
        console.log(`📄 ${config.name}`);
        
        const content = fs.readFileSync(fullPath, 'utf-8');
        const questions = parseQuestions(content, config.category);
        
        console.log(`   ✅ ${questions.length} domande\n`);
        
        allQuestions = allQuestions.concat(questions);
        found = true;
        break;
      }
    }
  }
  
  if (allQuestions.length === 0) {
    console.error('❌ Nessuna domanda trovata!');
    process.exit(1);
  }
  
  console.log(`\n📊 Totale: ${allQuestions.length} domande\n`);
  console.log('💾 Generazione SQL...\n');
  
  const sql = generateSQL(allQuestions);
  const outputPath = path.join(__dirname, 'COMPLETE-DATABASE-IMPORT.sql');
  
  fs.writeFileSync(outputPath, sql, 'utf-8');
  
  console.log('='.repeat(60));
  console.log('✅ FILE SQL CREATO!');
  console.log('='.repeat(60));
  console.log(`\n📁 File: ${outputPath}`);
  console.log(`📊 Dimensione: ${(sql.length / 1024).toFixed(1)} KB`);
  console.log(`📝 Domande: ${allQuestions.length}`);
  console.log('\n🎯 PROSSIMI PASSI:\n');
  console.log('1. Apri https://app.supabase.com');
  console.log('2. Seleziona il tuo progetto');
  console.log('3. Clicca "SQL Editor" nella sidebar');
  console.log('4. Apri il file COMPLETE-DATABASE-IMPORT.sql');
  console.log('5. Copia tutto il contenuto');
  console.log('6. Incollalo nel SQL Editor');
  console.log('7. Clicca "RUN" (o premi F5)');
  console.log('8. Aspetta conferma "Success"');
  console.log('9. Vai su http://localhost:3000/quiz');
  console.log('\n🎉 FATTO! Il quiz sarà pronto!\n');
}

main().catch(console.error);
