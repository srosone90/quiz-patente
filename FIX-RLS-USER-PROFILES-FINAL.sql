-- ============================================================
-- FIX-RLS-USER-PROFILES-FINAL.sql
-- Risolve la ricorsione infinita su user_profiles causata
-- dalle policy aggiunte da ADD-SCHOOL-PORTAL.sql
-- ============================================================

-- ── 1. Funzioni helper SECURITY DEFINER (nessuna ricorsione) ─────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS INTEGER LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT school_id FROM user_profiles WHERE id = auth.uid()
$$;

-- ── 2. Elimina TUTTE le policy SELECT e UPDATE problematiche ─────────────────
DROP POLICY IF EXISTS "view_profiles_unified"            ON user_profiles;
DROP POLICY IF EXISTS "School admin reads own students"  ON user_profiles;
DROP POLICY IF EXISTS "select_user_profiles"             ON user_profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles"        ON user_profiles;

-- ── 3. Policy SELECT pulita — nessuna subquery diretta su user_profiles ───────
CREATE POLICY "select_user_profiles" ON user_profiles
  FOR SELECT USING (
    id = auth.uid()
    OR get_my_role() = 'admin'
    OR (
      get_my_role() = 'school_admin'
      AND school_id = get_my_school_id()
      AND role IS DISTINCT FROM 'school_admin'
      AND role IS DISTINCT FROM 'admin'
    )
  );

-- ── 4. Policy UPDATE pulita ───────────────────────────────────────────────────
CREATE POLICY "admin_update_all_profiles" ON user_profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR get_my_role() = 'admin'
  );

-- ── Verifica ─────────────────────────────────────────────────────────────────
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_profiles';
