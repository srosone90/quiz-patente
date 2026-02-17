-- ============================================
-- AUTO-CONFERMA UTENTI (WORKAROUND)
-- Esegui questo nel SQL Editor di Supabase
-- ============================================

-- SOLUZIONE: Creiamo un trigger che conferma automaticamente
-- tutti i nuovi utenti appena si registrano

-- Questo trigger imposta confirmed_at = now() per ogni nuovo utente
CREATE OR REPLACE FUNCTION public.auto_confirm_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Se l'utente non è già confermato, confermalo automaticamente
  IF NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Applica il trigger a tutti i nuovi utenti
DROP TRIGGER IF EXISTS auto_confirm_new_users ON auth.users;
CREATE TRIGGER auto_confirm_new_users
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_users();

-- ============================================
-- Per confermare UTENTI GIÀ ESISTENTI (opzionale)
-- ============================================
-- Se hai già creato account non confermati, esegui anche questo:
UPDATE auth.users 
SET confirmed_at = NOW(), 
    email_confirmed_at = NOW()
WHERE confirmed_at IS NULL;

-- ============================================
-- VERIFICA
-- ============================================
SELECT 
  email,
  confirmed_at,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
