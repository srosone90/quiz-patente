-- ====================================================================
-- FIX XP - VERSIONE SAFE (adatta alla struttura esistente)
-- ====================================================================
-- Questo script verifica prima cosa esiste e poi aggiunge solo il necessario
-- ====================================================================

-- STEP 1: Crea funzione calculate_level (safe)
-- ====================================================================
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(xp / 100.0))::INTEGER);
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Crea tabella user_progress SOLO con colonne essenziali
-- ====================================================================
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_quizzes_completed INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 3: Aggiungi colonne opzionali (solo se non esistono)
-- ====================================================================
-- Verifica prima se esiste, poi aggiunge
DO $$ 
BEGIN
  -- Aggiungi best_streak solo se non esiste
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_progress' AND column_name = 'best_streak') THEN
    ALTER TABLE user_progress ADD COLUMN best_streak INTEGER DEFAULT 0;
  END IF;
END $$;

-- STEP 4: Crea indici
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_xp ON user_progress(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON user_progress(current_streak DESC);

-- STEP 5: DROP e RICREA trigger
-- ====================================================================
DROP TRIGGER IF EXISTS after_quiz_result_insert ON quiz_results;

CREATE OR REPLACE FUNCTION update_user_progress_after_quiz()
RETURNS TRIGGER AS $$
DECLARE
  xp_gained INTEGER;
  new_level INTEGER;
  current_streak_val INTEGER := 0;
  last_quiz_date DATE;
  days_diff INTEGER;
  new_streak INTEGER;
BEGIN
  -- Calcola XP guadagnati (usa correct_answers)
  xp_gained := NEW.correct_answers * 10;
  
  -- Recupera streak corrente (se esiste record)
  SELECT current_streak, last_activity_date 
  INTO current_streak_val, last_quiz_date 
  FROM user_progress 
  WHERE user_id = NEW.user_id;
  
  -- Calcola nuovo streak
  IF current_streak_val IS NOT NULL AND last_quiz_date IS NOT NULL THEN
    days_diff := CURRENT_DATE - last_quiz_date;
    
    IF days_diff = 1 THEN
      new_streak := current_streak_val + 1;
      xp_gained := xp_gained + (new_streak * 2);
    ELSIF days_diff = 0 THEN
      new_streak := current_streak_val;
    ELSE
      new_streak := 1;
    END IF;
  ELSE
    new_streak := 1;
  END IF;
  
  -- Calcola livello
  new_level := calculate_level(
    COALESCE((SELECT total_xp FROM user_progress WHERE user_id = NEW.user_id), 0) + xp_gained
  );
  
  -- Upsert semplificato (solo colonne essenziali)
  INSERT INTO user_progress (
    user_id, 
    total_xp, 
    level, 
    total_quizzes_completed, 
    total_questions_answered, 
    correct_answers,
    current_streak,
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
    NEW.correct_answers,
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
    correct_answers = user_progress.correct_answers + NEW.correct_answers,
    current_streak = new_streak,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW();
  
  -- Aggiorna best_streak solo se la colonna esiste
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'user_progress' AND column_name = 'best_streak') THEN
    UPDATE user_progress 
    SET best_streak = GREATEST(COALESCE(best_streak, 0), new_streak)
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Crea trigger
-- ====================================================================
CREATE TRIGGER after_quiz_result_insert
AFTER INSERT ON quiz_results
FOR EACH ROW
EXECUTE FUNCTION update_user_progress_after_quiz();

-- STEP 7: Popola progressi per utenti esistenti
-- ====================================================================
INSERT INTO user_progress (
  user_id, 
  total_xp, 
  level, 
  total_quizzes_completed, 
  total_questions_answered, 
  correct_answers, 
  current_streak,
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
  MAX(qr.completed_at)::DATE as last_date
FROM quiz_results qr
WHERE qr.user_id IS NOT NULL
  AND qr.user_id NOT IN (SELECT user_id FROM user_progress)
GROUP BY qr.user_id;

-- ====================================================================
-- VERIFICA
-- ====================================================================
SELECT COUNT(*) as users_with_progress FROM user_progress;

SELECT 
  user_id,
  total_xp,
  level,
  total_quizzes_completed,
  correct_answers
FROM user_progress
ORDER BY total_xp DESC
LIMIT 5;

COMMIT;
