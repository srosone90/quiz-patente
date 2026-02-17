-- ============================================
-- SETUP DATABASE SUPABASE
-- Quiz Ruolo Conducenti Taxi/NCC
-- ============================================

-- 1. Crea la tabella questions
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

-- 3. Policy per lettura pubblica (necessaria per freemium)
CREATE POLICY "Lettura pubblica delle domande"
ON questions FOR SELECT
TO public
USING (true);

-- 4. Indici per performance
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);

-- ============================================
-- ESEMPIO DI INSERIMENTO DOMANDE
-- ============================================

-- Esempio categoria: Legislazione Siciliana
INSERT INTO questions (question, answers, correct_answer, category, explanation)
VALUES (
  'A chi è rivolto il servizio di noleggio con conducente?',
  ARRAY[
    'ad una utenza indifferenziata',
    'all''utenza specifica che si deve rivolgere presso la sede del vettore o mediante mezzi tecnologici',
    'all''utenza specifica che prenota presso le apposite aree pubbliche di stazionamento'
  ],
  'all''utenza specifica che si deve rivolgere presso la sede del vettore o mediante mezzi tecnologici',
  'Legislazione Siciliana',
  'Il servizio di noleggio con conducente (NCC) è rivolto a un''utenza specifica che deve prenotare il servizio presso la sede del vettore o tramite mezzi tecnologici, a differenza del taxi che può essere fermato per strada.'
);

-- Esempio categoria: Codice della Strada
INSERT INTO questions (question, answers, correct_answer, category, explanation)
VALUES (
  'Qual è la velocità massima in ambito urbano?',
  ARRAY['30 km/h', '50 km/h', '70 km/h', '90 km/h'],
  '50 km/h',
  'Codice della Strada',
  'Il limite di velocità generale nei centri abitati è di 50 km/h, salvo diversa indicazione della segnaletica verticale.'
);

-- Esempio categoria: Toponomastica Palermo
INSERT INTO questions (question, answers, correct_answer, category, explanation)
VALUES (
  'Dove si trova il Teatro Massimo di Palermo?',
  ARRAY['Via Libertà', 'Piazza Verdi', 'Via Roma', 'Piazza Marina'],
  'Piazza Verdi',
  'Toponomastica Palermo',
  'Il Teatro Massimo, uno dei più grandi teatri d''opera d''Europa, si trova in Piazza Verdi a Palermo.'
);

-- ============================================
-- VERIFICA INSERIMENTO
-- ============================================
SELECT COUNT(*) as total_domande FROM questions;
SELECT category, COUNT(*) as num_domande 
FROM questions 
GROUP BY category 
ORDER BY num_domande DESC;

-- ============================================
-- TABELLE AGGIUNTIVE (OPZIONALI PER PREMIUM)
-- ============================================

-- Tabella profili utenti (per futuro sistema auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  codice_fiscale TEXT,
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabella risultati esami
CREATE TABLE IF NOT EXISTS exam_results (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER, -- in secondi
  plan TEXT DEFAULT 'free', -- 'free' o 'premium'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella vouchers (per codici sconto futuri)
CREATE TABLE IF NOT EXISTS vouchers (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTE IMPORTANTI
-- ============================================
-- 1. Popolare la tabella 'questions' con le domande dai file TXT forniti
-- 2. Le categorie suggerite sono:
--    - Toponomastica Palermo
--    - Legislazione Siciliana  
--    - Codice della Strada
-- 3. Il campo 'explanation' è mostrato solo agli utenti premium
-- 4. Assicurati che RLS sia abilitato per sicurezza
