-- Verifica quale account ha riscattato il codice
SELECT 
  u.email,
  u.id,
  up.subscription_type,
  up.subscription_expires_at
FROM user_profiles up
JOIN auth.users u ON up.id = u.id
WHERE u.id = 'a6627320-e650-46cd-a928-fc3824a8697b';

-- Verifica tutti i riscatti recenti
SELECT 
  u.email,
  ac.code,
  ac.plan_type,
  up.subscription_type as piano_attuale,
  cr.redeemed_at
FROM code_redemptions cr
JOIN auth.users u ON cr.user_id = u.id
JOIN access_codes ac ON cr.code_id = ac.id
JOIN user_profiles up ON up.id = u.id
ORDER BY cr.redeemed_at DESC
LIMIT 5;
