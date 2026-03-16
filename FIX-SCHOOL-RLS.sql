-- ============================================================
-- FIX-SCHOOL-RLS.sql
-- Risolve la ricorsione infinita introdotta dalla policy
-- "School admin reads own students" su user_profiles.
-- Usa funzioni SECURITY DEFINER (pattern già usato in questo progetto).
-- ============================================================

-- ── 1. Elimina la policy ricorsiva ───────────────────────────────────────────
DROP POLICY IF EXISTS "School admin reads own students" ON user_profiles;

-- ── 2. Funzione SECURITY DEFINER: restituisce school_id se sono school_admin ──
--      (bypassa RLS evitando la ricorsione infinita)
CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS INTEGER AS $$
  SELECT school_id
  FROM user_profiles
  WHERE id = auth.uid()
    AND role = 'school_admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 3. Aggiorna la policy SELECT unificata già esistente ─────────────────────
--      (quella creata da FIX-RICORSIONE-INFINITA.sql)
DROP POLICY IF EXISTS "view_profiles_unified" ON user_profiles;

CREATE POLICY "view_profiles_unified"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  -- Ogni utente vede il proprio profilo
  auth.uid() = id
  OR
  -- Admin vede tutti (SECURITY DEFINER, no ricorsione)
  is_current_user_admin()
  OR
  -- School admin vede i propri studenti (SECURITY DEFINER, no ricorsione)
  (
    get_my_school_id() IS NOT NULL
    AND school_id = get_my_school_id()
    AND role IS DISTINCT FROM 'school_admin'
    AND role IS DISTINCT FROM 'admin'
  )
);

-- ── Verifica ─────────────────────────────────────────────────────────────────
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_profiles' ORDER BY cmd, policyname;
SELECT COUNT(*) AS "Totale Utenti visibili" FROM user_profiles;
