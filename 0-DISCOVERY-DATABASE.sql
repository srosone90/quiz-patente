-- ====================================================================
-- DISCOVERY: Scopri struttura database per capire cosa esiste
-- ====================================================================
-- ESEGUI QUESTO SCRIPT PRIMA DI TUTTO per vedere la struttura reale
-- ====================================================================

-- 1. Mostra TUTTE le tabelle del database
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Mostra struttura user_profiles (o come si chiama)
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name IN ('user_profiles', 'profiles')
ORDER BY table_name, ordinal_position;

-- 3. Mostra struttura user_progress (se esiste)
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'user_progress'
ORDER BY ordinal_position;

-- 4. Mostra struttura quiz_results
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_results'
ORDER BY ordinal_position;

-- 5. Mostra struttura access_codes
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'access_codes'
ORDER BY ordinal_position;

-- 6. Verifica quali funzioni esistono già
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%level%'
ORDER BY routine_name;

-- 7. Verifica RLS policies esistenti
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('user_profiles', 'profiles', 'user_progress')
ORDER BY tablename, policyname;

-- ====================================================================
-- ISTRUZIONI:
-- 1. Esegui questo script su Supabase
-- 2. Copia TUTTO l'output qui sotto
-- 3. Mandamelo così vedo la struttura reale del tuo database
-- 4. Creerò script personalizzati basati sulla TUA struttura
-- ====================================================================
