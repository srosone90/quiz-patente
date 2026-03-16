-- ============================================================
-- FIX-RLS-DEFINITIVO.sql
-- Ripristina le policy user_profiles come erano prima
-- (view_profiles_unified con is_current_user_admin funzionava)
-- ============================================================

-- ── 1. Funzione school_admin helper (SECURITY DEFINER = nessuna ricorsione) ──
CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT school_id FROM user_profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin_for(p_school_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
      AND role = 'school_admin'
      AND school_id = p_school_id
  );
END;
$$;

-- ── 2. Elimina TUTTE le SELECT policy esistenti su user_profiles ─────────────
DROP POLICY IF EXISTS "view_profiles_unified"           ON user_profiles;
DROP POLICY IF EXISTS "School admin reads own students" ON user_profiles;
DROP POLICY IF EXISTS "select_user_profiles"            ON user_profiles;

-- ── 3. Ripristina view_profiles_unified (ERA FUNZIONANTE) ────────────────────
CREATE POLICY "view_profiles_unified" ON user_profiles
  FOR SELECT USING (
    auth.uid() = id
    OR is_current_user_admin()
    OR is_school_admin_for(school_id)
  );

-- ── 4. Ripristina UPDATE policy (usa is_current_user_admin) ──────────────────
DROP POLICY IF EXISTS "admin_update_all_profiles" ON user_profiles;

CREATE POLICY "admin_update_all_profiles" ON user_profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR is_current_user_admin()
  );

-- ── Verifica finale ───────────────────────────────────────────────────────────
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_profiles' ORDER BY cmd, policyname;
