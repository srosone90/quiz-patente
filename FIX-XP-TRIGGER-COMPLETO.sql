-- ====================================================================
-- FIX DEFINITIVO: Sistema XP con tutte le dipendenze
-- ====================================================================
-- Risolve: XP non aumentano, progresso vuoto, livelli non si aggiornano
-- ====================================================================

-- STEP 1: Crea funzione calculate_level (se non esiste)
-- ====================================================================
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Livello = sqrt(XP / 100)
  -- 100 XP = livello 1, 400 XP = livello 2, 900 XP = livello 3, etc.
  RETURN GREATEST(1, FLOOR(SQRT(xp / 100.0))::INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Test funzione
-- SELECT calculate_level(0);   -- dovrebbe tornare 1
-- SELECT calculate_level(100); -- dovrebbe tornare 1
-- SELECT calculate_level(400); -- dovrebbe tornare 2
-- SELECT calculate_level(900); -- dovrebbe tornare 3

-- STEP 2: Verifica e crea tabelle necessarie
-- ====================================================================

-- Tabella user_progress (se non esiste)
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_quizzes_completed INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_xp ON user_progress(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON user_progress(current_streak DESC);

-- STEP 3: DROP trigger esistente (se c'è)
-- ====================================================================
DROP TRIGGER IF EXISTS after_quiz_result_insert ON quiz_results;

-- STEP 4: Crea funzione trigger CORRETTA
-- ====================================================================
CREATE OR REPLACE FUNCTION update_user_progress_after_quiz()
RETURNS TRIGGER AS $$
DECLARE
  xp_gained INTEGER;
  new_level INTEGER;
  streak_bonus INTEGER := 0;
  last_quiz_date DATE;
  days_diff INTEGER;
  new_streak INTEGER;
BEGIN
  -- ✅ CORRETTO: Usa correct_answers (NON 'score')
  xp_gained := NEW.correct_answers * 10;
  
  -- Calcola streak bonus
  SELECT current_streak, last_activity_date 
  INTO streak_bonus, last_quiz_date 
  FROM user_progress 
  WHERE user_id = NEW.user_id;
  
  IF streak_bonus IS NOT NULL AND last_quiz_date IS NOT NULL THEN
    days_diff := CURRENT_DATE - last_quiz_date;
    
    IF days_diff = 1 THEN
      -- Giorno consecutivo: incrementa streak
      new_streak := streak_bonus + 1;
      xp_gained := xp_gained + (new_streak * 2); -- Bonus XP
    ELSIF days_diff = 0 THEN
      -- Stesso giorno: mantieni streak
      new_streak := streak_bonus;
    ELSE
      -- Streak rotta
      new_streak := 1;
    END IF;
  ELSE
    new_streak := 1;
  END IF;
  
  -- Calcola nuovo livello basato su XP totali
  new_level := calculate_level(COALESCE((SELECT total_xp FROM user_progress WHERE user_id = NEW.user_id), 0) + xp_gained);
  
  -- Upsert user_progress con campi CORRETTI
  INSERT INTO user_progress (
    user_id, 
    total_xp, 
    level, 
    total_quizzes_completed, 
    total_questions_answered, 
    correct_answers,
    current_streak,
    best_streak,
    last_activity_date,
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    xp_gained,
    new_level,
    1,
    NEW.total_questions,
    NEW.correct_answers,  -- ✅ CORRETTO (era NEW.score)
    new_streak,
    new_streak,
    CURRENT_DATE,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_progress.total_xp + xp_gained,
    level = calculate_level(user_progress.total_xp + xp_gained),
    total_quizzes_completed = user_progress.total_quizzes_completed + 1,
    total_questions_answered = user_progress.total_questions_answered + NEW.total_questions,
    correct_answers = user_progress.correct_answers + NEW.correct_answers,  -- ✅ CORRETTO (era NEW.score)
    current_streak = new_streak,
    best_streak = GREATEST(user_progress.best_streak, new_streak),
    last_activity_date = CURRENT_DATE,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Crea trigger
-- ====================================================================
CREATE TRIGGER after_quiz_result_insert
AFTER INSERT ON quiz_results
FOR EACH ROW
EXECUTE FUNCTION update_user_progress_after_quiz();

-- STEP 6: Popola user_progress per utenti esistenti con quiz già fatti
-- ====================================================================
-- Questo crea record iniziali basati sui quiz già completati
INSERT INTO user_progress (
  user_id, 
  total_xp, 
  level, 
  total_quizzes_completed, 
  total_questions_answered, 
  correct_answers, 
  current_streak, 
  best_streak,
  last_activity_date
)
SELECT 
  qr.user_id,
  COALESCE(SUM(qr.correct_answers * 10), 0) as total_xp,
  calculate_level(COALESCE(SUM(qr.correct_answers * 10), 0)) as level,
  COUNT(qr.id) as total_quizzes,
  COALESCE(SUM(qr.total_questions), 0) as total_q,
  COALESCE(SUM(qr.correct_answers), 0) as correct,
  0 as streak,
  0 as best_streak,
  MAX(qr.completed_at)::DATE as last_date
FROM quiz_results qr
WHERE qr.user_id IS NOT NULL
  AND qr.user_id NOT IN (SELECT user_id FROM user_progress)
GROUP BY qr.user_id;

-- ====================================================================
-- VERIFICA SUCCESSO
-- ====================================================================
-- Controlla quanti record sono stati creati
SELECT COUNT(*) as users_with_progress FROM user_progress;

-- Controlla alcuni esempi
SELECT 
  user_id,
  total_xp,
  level,
  total_quizzes_completed,
  correct_answers,
  current_streak
FROM user_progress
ORDER BY total_xp DESC
LIMIT 5;

-- ====================================================================
-- TEST MANUALE (OPZIONALE)
-- ====================================================================
-- Prova a inserire un quiz fittizio e verifica che XP vengano assegnati:
-- 
-- DO $$
-- DECLARE
--   test_user_id UUID;
-- BEGIN
--   -- Prendi primo utente
--   SELECT user_id INTO test_user_id FROM user_progress LIMIT 1;
--   
--   IF test_user_id IS NOT NULL THEN
--     -- Inserisci quiz test
--     INSERT INTO quiz_results (user_id, correct_answers, total_questions, score_percentage, quiz_type, completed_at)
--     VALUES (test_user_id, 15, 20, 75, 'premium', NOW());
--     
--     -- Mostra XP aggiornati
--     RAISE NOTICE 'Test completato! Controlla user_progress per utente %', test_user_id;
--   ELSE
--     RAISE NOTICE 'Nessun utente trovato per test';
--   END IF;
-- END $$;
-- 
-- SELECT * FROM user_progress ORDER BY updated_at DESC LIMIT 1;

-- ====================================================================
-- FINE SCRIPT
-- ====================================================================

COMMIT;
