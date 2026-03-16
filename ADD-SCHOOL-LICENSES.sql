-- ============================================================
-- ADD-SCHOOL-LICENSES.sql
-- Tabella school_licenses: quali tipi patente ha abilitato ogni scuola
-- Esegui nel SQL Editor di Supabase DOPO ADD-SCHOOL-PORTAL.sql
-- ============================================================

-- ── 1. Tabella school_licenses ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school_licenses (
  id            SERIAL PRIMARY KEY,
  school_id     INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  license_type  TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, license_type)
);

-- ── 2. Indice ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_school_licenses_school_id ON school_licenses(school_id);

-- ── 3. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE school_licenses ENABLE ROW LEVEL SECURITY;

-- Admin: tutto
CREATE POLICY "Admin full access on school_licenses" ON school_licenses
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- School admin: legge solo le licenze della propria scuola
CREATE POLICY "School admin reads own school licenses" ON school_licenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'school_admin'
        AND school_id = school_licenses.school_id
    )
  );

-- Studenti: leggono le licenze della propria scuola (per mostrare le card nel dashboard)
CREATE POLICY "Students read own school licenses" ON school_licenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND school_id = school_licenses.school_id
    )
  );

-- ── Verifica ─────────────────────────────────────────────────────────────────
-- SELECT s.name, sl.license_type, sl.is_active
-- FROM school_licenses sl
-- JOIN schools s ON s.id = sl.school_id
-- ORDER BY s.name, sl.license_type;
