-- ============================================
-- VERIFICA RISULTATI SALVATI NEL DATABASE
-- Esegui questo nel SQL Editor di Supabase
-- ============================================

-- 1. Verifica tutti i quiz salvati
SELECT 
  qr.id,
  qr.user_id,
  u.email,
  qr.score_percentage,
  qr.correct_answers,
  qr.total_questions,
  qr.quiz_type,
  qr.completed_at,
  CASE 
    WHEN qr.score_percentage >= 90 THEN '✅ SUPERATO'
    ELSE '❌ DA MIGLIORARE'
  END as risultato
FROM quiz_results qr
LEFT JOIN auth.users u ON qr.user_id = u.id
ORDER BY qr.completed_at DESC
LIMIT 20;

-- 2. Verifica l'ultimo quiz salvato per ogni utente
SELECT 
  u.email,
  qr.score_percentage,
  qr.correct_answers,
  qr.total_questions,
  qr.completed_at,
  CASE 
    WHEN qr.score_percentage >= 90 THEN 'SUPERATO'
    ELSE 'DA MIGLIORARE'
  END as risultato
FROM (
  SELECT DISTINCT ON (user_id) *
  FROM quiz_results
  ORDER BY user_id, completed_at DESC
) qr
LEFT JOIN auth.users u ON qr.user_id = u.id
ORDER BY qr.completed_at DESC;

-- 3. Statistiche per utente
SELECT 
  u.email,
  COUNT(*) as totale_quiz,
  AVG(qr.score_percentage) as media_punteggio,
  MAX(qr.score_percentage) as punteggio_massimo,
  COUNT(CASE WHEN qr.score_percentage >= 90 THEN 1 END) as quiz_superati,
  COUNT(CASE WHEN qr.score_percentage < 90 THEN 1 END) as quiz_da_migliorare
FROM quiz_results qr
LEFT JOIN auth.users u ON qr.user_id = u.id
GROUP BY u.email
ORDER BY totale_quiz DESC;

-- 4. Verifica se ci sono risultati nelle ultime 24 ore
SELECT 
  u.email,
  qr.score_percentage,
  qr.correct_answers,
  qr.total_questions,
  qr.completed_at,
  NOW() - qr.completed_at as tempo_fa
FROM quiz_results qr
LEFT JOIN auth.users u ON qr.user_id = u.id
WHERE qr.completed_at > NOW() - INTERVAL '24 hours'
ORDER BY qr.completed_at DESC;

-- 5. Conta totale dei risultati
SELECT 
  COUNT(*) as totale_quiz_salvati,
  COUNT(DISTINCT user_id) as utenti_unici,
  AVG(score_percentage) as media_globale,
  COUNT(CASE WHEN score_percentage >= 90 THEN 1 END) as superati,
  COUNT(CASE WHEN score_percentage < 90 THEN 1 END) as non_superati
FROM quiz_results;
