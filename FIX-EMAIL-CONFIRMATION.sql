-- ============================================
-- FIX COMPLETO CONFERMA EMAIL
-- Esegui questo nel SQL Editor di Supabase
-- ============================================

-- STEP 1: Conferma IMMEDIATAMENTE tutti gli utenti esistenti
-- Nota: confirmed_at è auto-generato, aggiorniamo solo email_confirmed_at
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- STEP 2: Crea la funzione per auto-conferma (DROP + CREATE per sicurezza)
DROP FUNCTION IF EXISTS public.auto_confirm_users() CASCADE;

CREATE OR REPLACE FUNCTION public.auto_confirm_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Conferma automaticamente ogni nuovo utente
  -- confirmed_at è auto-generato, impostiamo solo email_confirmed_at
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Applica il trigger
DROP TRIGGER IF EXISTS auto_confirm_new_users ON auth.users;

CREATE TRIGGER auto_confirm_new_users
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_users();

-- ============================================
-- VERIFICA
-- ============================================

-- Mostra tutti gli utenti e il loro stato di conferma
SELECT 
  email,
  confirmed_at IS NOT NULL as is_confirmed,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- Verifica che il trigger esista
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'auto_confirm_new_users';

SELECT '✅ Fix completato! Tutti gli utenti sono ora confermati e i nuovi si confermeranno automaticamente.' as status;
