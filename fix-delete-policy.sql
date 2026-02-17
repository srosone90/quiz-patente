-- ========================================
-- FIX: Aggiunta policy DELETE per access_codes
-- ========================================

-- La funzione deleteAccessCode non funzionava perché mancava la policy DELETE

CREATE POLICY "Solo admin eliminano codici"
ON access_codes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- ISTRUZIONI:
-- 1. Apri Supabase Dashboard → SQL Editor
-- 2. Copia questo file nella query
-- 3. Esegui
-- 4. Ora la funzione deleteAccessCode funzionerà correttamente
