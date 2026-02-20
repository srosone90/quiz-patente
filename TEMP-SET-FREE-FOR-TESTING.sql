-- ============================================
-- TEMPORANEO: Rendi account FREE per testare il box CTA Premium
-- ============================================
-- Email: srosone90@gmail.com
-- Per tornare premium usa: TEMP-RESTORE-PREMIUM.sql

UPDATE profiles
SET 
  subscription_type = 'free',
  subscription_expires_at = NULL
FROM auth.users au
WHERE profiles.id = au.id
  AND au.email = 'srosone90@gmail.com';

-- Verifica
SELECT 
  au.email,
  p.subscription_type,
  p.subscription_expires_at,
  p.is_admin
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'srosone90@gmail.com';
