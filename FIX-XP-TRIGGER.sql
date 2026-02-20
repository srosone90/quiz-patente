-- ====================================================================
-- FIX CRITICO: Trigger XP usa campo 'score' che NON ESISTE
-- ====================================================================
-- PROBLEMA: Il trigger usa NEW.score ma il campo si chiama 'correct_answers'
-- CONSEGUENZA: Trigger fallisce silenziosamente → XP sempre 0
-- ====================================================================

-- 1. DROP trigger esistente
DROP TRIGGER IF EXISTS after_quiz_result_insert ON quiz_results;

-- 2. RICREARE funzione con campi CORRETTI
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
  -- ✅ CORRETTO: Usa correct_answers (non 'score')
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
    last_activity_date = CURRENT_DATE,
    updated_at = NOW();
  
  -- Controlla se ha sbloccato achievement
  PERFORM check_and_unlock_achievements(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. RICREARE trigger
CREATE TRIGGER after_quiz_result_insert
AFTER INSERT ON quiz_results
FOR EACH ROW
EXECUTE FUNCTION update_user_progress_after_quiz();

-- ====================================================================
-- 4. POPOLARE user_progress per utenti esistenti (se mancante)
-- ====================================================================
INSERT INTO user_progress (user_id, total_xp, level, total_quizzes_completed, total_questions_answered, correct_answers, current_streak, last_activity_date)
SELECT 
  u.id,
  COALESCE(SUM(qr.correct_answers * 10), 0) as total_xp,
  calculate_level(COALESCE(SUM(qr.correct_answers * 10), 0)) as level,
  COUNT(qr.id) as total_quizzes,
  COALESCE(SUM(qr.total_questions), 0) as total_q,
  COALESCE(SUM(qr.correct_answers), 0) as correct,
  0 as streak,
  CURRENT_DATE
FROM user_profiles u
LEFT JOIN quiz_results qr ON qr.user_id = u.id
WHERE u.id NOT IN (SELECT user_id FROM user_progress)
GROUP BY u.id;

-- ====================================================================
-- 5. VERIFICA FUNZIONAMENTO
-- ====================================================================
-- Dopo aver eseguito questo script, testa con:
-- 
-- INSERT INTO quiz_results (user_id, correct_answers, total_questions, score_percentage, quiz_type, completed_at)
-- VALUES ((SELECT id FROM user_profiles LIMIT 1), 15, 20, 75, 'premium', NOW());
-- 
-- SELECT * FROM user_progress WHERE user_id = (SELECT id FROM user_profiles LIMIT 1);
-- 
-- Dovresti vedere total_xp = 150 (15 * 10)
-- ====================================================================

COMMIT;
