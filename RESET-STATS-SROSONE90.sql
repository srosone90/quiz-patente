-- ============================================
-- AZZERA STATISTICHE PROFILO srosone90@gmail.com
-- ============================================
-- Email: srosone90@gmail.com
-- Questo script cancella:
-- - Tutti i quiz completati (quiz_results)
-- - Tutte le risposte (quiz_answers)
-- - Statistiche di gamification (se presenti)

-- 1. Cancella tutti i risultati dei quiz
DELETE FROM quiz_results
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'srosone90@gmail.com'
);

-- 2. Cancella tutte le risposte (corrette e sbagliate)
DELETE FROM quiz_answers
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'srosone90@gmail.com'
);

-- 3. Reset statistiche user_progress (gamification)
DELETE FROM user_progress
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'srosone90@gmail.com'
);

-- Verifica cosa è stato cancellato
SELECT 
  au.email,
  up.subscription_type,
  up.subscription_expires_at,
  (SELECT COUNT(*) FROM quiz_results WHERE user_id = au.id) as quiz_count,
  (SELECT COUNT(*) FROM quiz_answers WHERE user_id = au.id) as answers_count
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE au.email = 'srosone90@gmail.com';
