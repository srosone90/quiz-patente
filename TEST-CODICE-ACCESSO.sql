-- ============================================
-- TEST COMPLETO CODICI ACCESSO
-- Esegui questo nel SQL Editor di Supabase
-- ============================================

-- STEP 1: Reset il tuo account per test
-- Account di test: srosone1990@gmail.com
UPDATE user_profiles
SET 
  subscription_type = 'free',
  subscription_expires_at = NULL,
  updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'srosone1990@gmail.com');

-- STEP 2: Cancella eventuali riscatti precedenti (per poter testare di nuovo)
DELETE FROM code_redemptions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'srosone1990@gmail.com');

-- STEP 3: Verifica lo stato attuale
SELECT 
  u.email,
  up.subscription_type,
  up.subscription_expires_at,
  up.is_admin
FROM user_profiles up
JOIN auth.users u ON up.id = u.id
WHERE u.email = 'srosone1990@gmail.com';

SELECT '✅ Account resettato a FREE. Ora puoi testare il riscatto del codice!' as status;

-- ============================================
-- DOPO AVER RISCATTATO IL CODICE, ESEGUI QUESTO:
-- ============================================

-- Verifica se il codice è stato riscattato
SELECT 
  u.email,
  up.subscription_type as piano_attuale,
  up.subscription_expires_at as scade_il,
  ac.code as codice_usato,
  ac.plan_type as tipo_piano,
  cr.redeemed_at as riscattato_il
FROM user_profiles up
JOIN auth.users u ON up.id = u.id
LEFT JOIN code_redemptions cr ON cr.user_id = u.id
LEFT JOIN access_codes ac ON ac.id = cr.code_id
WHERE u.email = 'srosone1990@gmail.com'
ORDER BY cr.redeemed_at DESC
LIMIT 1;
