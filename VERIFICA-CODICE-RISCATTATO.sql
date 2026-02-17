-- ============================================
-- VERIFICA SE IL CODICE È STATO RISCATTATO
-- Esegui questo nel SQL Editor di Supabase
-- ============================================

-- 1. Vedi tutti i codici generati e quanti sono stati usati
SELECT 
  code,
  school_name,
  plan_type,
  duration_days,
  max_uses,
  used_count,
  is_active,
  created_at
FROM access_codes
ORDER BY created_at DESC;

-- 2. Vedi chi ha riscattato i codici
SELECT 
  ac.code,
  ac.school_name,
  ac.plan_type,
  u.email,
  cr.redeemed_at
FROM code_redemptions cr
JOIN access_codes ac ON cr.code_id = ac.id
JOIN auth.users u ON cr.user_id = u.id
ORDER BY cr.redeemed_at DESC;

-- 3. Vedi lo stato subscription degli utenti
SELECT 
  u.email,
  up.subscription_type,
  up.subscription_expires_at,
  up.updated_at
FROM user_profiles up
JOIN auth.users u ON up.id = u.id
ORDER BY up.updated_at DESC;
