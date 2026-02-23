-- ============================================
-- FIX REGISTRAZIONE UTENTI - Errore 500
-- ============================================
-- Problema: Trigger handle_new_user() non include tutte le colonne
-- Soluzione: Aggiorna function per includere email e altri campi

-- 1. Drop del trigger esistente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Ricrea function con TUTTI i campi necessari
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    subscription_type,
    subscription_expires_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free',
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Evita errori se già esiste
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ricrea trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verifica
SELECT 'Trigger aggiornato con successo!' as status;

-- Test: Prova a vedere se ci sono utenti senza profilo
SELECT 
  au.id,
  au.email,
  up.id as profile_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
LIMIT 5;
