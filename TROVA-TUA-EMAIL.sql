-- ====================================================================
-- TROVA LA TUA EMAIL E UUID - Esegui questo per sapere quale email usare
-- ====================================================================

-- Mostra tutti gli utenti con email e UUID
-- Cerca la TUA email (quella con cui accedi al sito)
SELECT 
  au.id as uuid,
  au.email,
  au.created_at as registrato_il,
  up.full_name,
  up.subscription_type
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
ORDER BY au.created_at DESC;

-- ====================================================================
-- DOPO AVER TROVATO LA TUA EMAIL:
-- ====================================================================
-- Copia l'UUID della riga che corrisponde alla TUA email
-- Poi esegui questo (sostituisci l'UUID):

-- UPDATE user_profiles 
-- SET role = 'admin' 
-- WHERE id = 'INCOLLA_QUI_IL_TUO_UUID';

-- Verifica:
-- SELECT up.id, au.email, up.role 
-- FROM user_profiles up
-- LEFT JOIN auth.users au ON au.id = up.id
-- WHERE up.role = 'admin';
