-- ====================================================================
-- FEATURE: Gestione Pagamenti Codici B2B
-- ====================================================================
-- AGGIUNGE: Campi payment_status, payment_date, invoice_number
--           per tracciare pagamenti scuole guida
-- ====================================================================

-- 1. Aggiungi colonne alla tabella access_codes
ALTER TABLE access_codes 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- 2. Crea indice per filtraggio veloce
CREATE INDEX IF NOT EXISTS idx_access_codes_payment_status 
ON access_codes(payment_status);

-- 3. Aggiungi commenti per documentazione
COMMENT ON COLUMN access_codes.payment_status IS 'Stato pagamento: pending (in attesa), paid (pagato), overdue (scaduto), cancelled (annullato)';
COMMENT ON COLUMN access_codes.payment_date IS 'Data ricezione pagamento';
COMMENT ON COLUMN access_codes.invoice_number IS 'Numero fattura o ricevuta';
COMMENT ON COLUMN access_codes.payment_amount IS 'Importo pagato in euro';
COMMENT ON COLUMN access_codes.payment_notes IS 'Note interne sul pagamento';

-- 4. Update codici esistenti (imposta come paid se sono attivi da più di 7 giorni)
UPDATE access_codes
SET payment_status = 'paid',
    payment_date = created_at + INTERVAL '1 day'
WHERE is_active = true 
  AND created_at < NOW() - INTERVAL '7 days'
  AND payment_status = 'pending';

-- 5. Funzione per segnare automaticamente come overdue
CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS void AS $$
BEGIN
  UPDATE access_codes
  SET payment_status = 'overdue'
  WHERE payment_status = 'pending'
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 6. Query utili per gestione pagamenti
-- ====================================================================

-- Codici in attesa di pagamento (ultimi 30 giorni)
-- SELECT code, school_name, created_at, plan_type, max_uses * 
--   CASE 
--     WHEN plan_type = 'last_minute' THEN 29
--     WHEN plan_type = 'senza_pensieri' THEN 59
--     ELSE 0
--   END as importo_dovuto
-- FROM access_codes
-- WHERE payment_status = 'pending'
-- AND created_at > NOW() - INTERVAL '30 days'
-- ORDER BY created_at DESC;

-- Totale incassi mese corrente
-- SELECT 
--   SUM(payment_amount) as totale_incassi,
--   COUNT(*) as numero_pagamenti
-- FROM access_codes
-- WHERE payment_status = 'paid'
-- AND payment_date >= DATE_TRUNC('month', CURRENT_DATE);

-- Codici scaduti (da sollecitare)
-- SELECT code, school_name, created_at, 
--   EXTRACT(DAY FROM NOW() - created_at) as giorni_attesa
-- FROM access_codes
-- WHERE payment_status = 'pending'
-- AND created_at < NOW() - INTERVAL '30 days'
-- ORDER BY created_at ASC;

-- ====================================================================
COMMIT;
