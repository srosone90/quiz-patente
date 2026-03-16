-- ============================================================
-- ADD-LICENSE-TO-CODES.sql
-- Aggiunge license_type ai codici e al profilo studente.
-- Ogni codice è ora specifico per una patente.
-- ============================================================

-- ── 1. Aggiungi license_type ad access_codes ─────────────────────────────────
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS license_type TEXT;

-- ── 2. Aggiungi license_type a user_profiles ─────────────────────────────────
--      (la patente specifica attivata con il codice)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS license_type TEXT;

-- ── 3. Aggiorna la RPC redeem_access_code ────────────────────────────────────
CREATE OR REPLACE FUNCTION redeem_access_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_code_record RECORD;
  v_plan_type TEXT;
  v_duration_days INTEGER;
  v_new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT * INTO v_code_record
  FROM access_codes
  WHERE code = p_code
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND used_count < max_uses;

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'message', 'Codice non valido o scaduto');
  END IF;

  IF EXISTS (
    SELECT 1 FROM code_redemptions
    WHERE code_id = v_code_record.id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', FALSE, 'message', 'Hai già utilizzato questo codice');
  END IF;

  v_plan_type     := v_code_record.plan_type;
  v_duration_days := v_code_record.duration_days;

  SELECT
    CASE
      WHEN subscription_expires_at IS NULL OR subscription_expires_at < NOW()
      THEN NOW() + (v_duration_days || ' days')::INTERVAL
      ELSE subscription_expires_at + (v_duration_days || ' days')::INTERVAL
    END
  INTO v_new_expiry
  FROM user_profiles
  WHERE id = p_user_id;

  -- Aggiorna profilo: subscription + school_id + license_type dal codice
  UPDATE user_profiles
  SET
    subscription_type       = v_plan_type,
    subscription_expires_at = v_new_expiry,
    school_id               = v_code_record.school_id,
    license_type            = v_code_record.license_type,
    updated_at              = NOW()
  WHERE id = p_user_id;

  INSERT INTO code_redemptions (code_id, user_id)
  VALUES (v_code_record.id, p_user_id);

  UPDATE access_codes
  SET used_count = used_count + 1
  WHERE id = v_code_record.id;

  RETURN json_build_object(
    'success',      TRUE,
    'message',      'Codice riscattato con successo',
    'plan_type',    v_plan_type,
    'license_type', v_code_record.license_type,
    'expires_at',   v_new_expiry
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Verifica ─────────────────────────────────────────────────────────────────
SELECT id, code, school_id, license_type, plan_type FROM access_codes LIMIT 5;
