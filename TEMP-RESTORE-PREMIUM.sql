-- ============================================
-- TEMPORANEO: Ripristina account PREMIUM dopo test
-- ============================================
-- Email: srosone90@gmail.com
-- Scadenza: 19/03/2026

UPDATE profiles
SET 
  subscription_type = 'premium_annual',
  subscription_expires_at = '2026-03-19T23:59:59+00:00'
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
