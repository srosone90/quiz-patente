-- ============================================================
-- SCHOOL SUBSCRIPTIONS TABLE
-- Tabella per future funzionalità di abbonamento scuola
-- (struttura preparata, non ancora usata dalla UI)
-- ============================================================

CREATE TABLE IF NOT EXISTS school_subscriptions (
  id            BIGSERIAL PRIMARY KEY,
  school_id     BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  plan_type     TEXT NOT NULL DEFAULT 'basic',   -- es. 'basic', 'pro', 'enterprise'
  status        TEXT NOT NULL DEFAULT 'active',  -- 'active', 'cancelled', 'expired', 'trialing'
  starts_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at       TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id     TEXT,
  features      JSONB NOT NULL DEFAULT '{}',     -- es. {"max_codes": 100, "analytics": true}
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sullo school_id per lookup veloci
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_school_id
  ON school_subscriptions(school_id);

-- Index sullo status per filtrare gli abbonamenti attivi
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_status
  ON school_subscriptions(status);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_school_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_school_subscriptions_updated_at
  ON school_subscriptions;

CREATE TRIGGER trigger_update_school_subscriptions_updated_at
  BEFORE UPDATE ON school_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_school_subscriptions_updated_at();

-- RLS: le scuole vedono solo il proprio abbonamento; gli admin vedono tutto
ALTER TABLE school_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_admin_own_subscription" ON school_subscriptions
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'school_admin'
    )
  );

CREATE POLICY "admin_all_subscriptions" ON school_subscriptions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
