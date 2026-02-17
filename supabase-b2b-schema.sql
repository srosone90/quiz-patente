-- ========================================
-- SCHEMA DATABASE GESTIONALE B2B
-- Gestione Scuole Guida e CRM
-- ========================================

-- 1. TABELLA CLIENTI B2B (Scuole Guida)
CREATE TABLE IF NOT EXISTS b2b_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dati anagrafici
  business_name TEXT NOT NULL,
  vat_number TEXT,
  tax_code TEXT,
  legal_address TEXT,
  city TEXT,
  postal_code TEXT,
  province TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  pec TEXT,
  website TEXT,
  
  -- Dati commerciali
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'contacted', 'proposal_sent', 'negotiation', 'active', 'inactive', 'lost')),
  source TEXT CHECK (source IN ('phone', 'email', 'fair', 'referral', 'website', 'other')),
  potential_students_year INTEGER,
  commercial_notes TEXT,
  
  -- Contabilità
  payment_terms TEXT DEFAULT '30_days' CHECK (payment_terms IN ('immediate', '30_days', '60_days', '90_days')),
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  billing_frequency TEXT DEFAULT 'immediate' CHECK (billing_frequency IN ('immediate', 'monthly', 'quarterly', 'annual')),
  sdi_code TEXT,
  
  -- Metadata
  first_contact_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  
  -- Indici
  CONSTRAINT unique_vat_number UNIQUE (vat_number)
);

CREATE INDEX idx_b2b_clients_status ON b2b_clients(status);
CREATE INDEX idx_b2b_clients_archived ON b2b_clients(archived);
CREATE INDEX idx_b2b_clients_created_at ON b2b_clients(created_at);

-- 2. TABELLA REFERENTI
CREATE TABLE IF NOT EXISTS b2b_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES b2b_clients(id) ON DELETE CASCADE,
  
  full_name TEXT NOT NULL,
  role TEXT,
  direct_phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_b2b_contacts_client ON b2b_contacts(client_id);

-- 3. TABELLA CONTRATTI
CREATE TABLE IF NOT EXISTS b2b_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES b2b_clients(id) ON DELETE CASCADE,
  
  contract_number TEXT UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'renewal')),
  contract_type TEXT DEFAULT 'standard' CHECK (contract_type IN ('standard', 'premium', 'custom')),
  
  -- Condizioni economiche
  price_per_student DECIMAL(10,2),
  included_students INTEGER,
  
  -- Servizi inclusi (JSON)
  included_services JSONB DEFAULT '{}',
  
  -- Documenti
  contract_pdf_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_b2b_contracts_client ON b2b_contracts(client_id);
CREATE INDEX idx_b2b_contracts_status ON b2b_contracts(status);
CREATE INDEX idx_b2b_contracts_end_date ON b2b_contracts(end_date);

-- 4. TABELLA APPUNTAMENTI
CREATE TABLE IF NOT EXISTS b2b_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES b2b_clients(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('call', 'meeting', 'presentation', 'followup', 'contract_signing', 'renewal', 'support', 'review')),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  location_type TEXT CHECK (location_type IN ('client_office', 'our_office', 'videocall', 'phone')),
  
  participants TEXT,
  objective TEXT,
  pre_notes TEXT,
  outcome_notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_b2b_appointments_client ON b2b_appointments(client_id);
CREATE INDEX idx_b2b_appointments_date ON b2b_appointments(appointment_date);
CREATE INDEX idx_b2b_appointments_status ON b2b_appointments(status);

-- 5. TABELLA FATTURE
CREATE TABLE IF NOT EXISTS b2b_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES b2b_clients(id) ON DELETE CASCADE,
  
  invoice_number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  net_amount DECIMAL(10,2) NOT NULL,
  vat_percentage DECIMAL(5,2) DEFAULT 22,
  vat_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  
  description TEXT,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'overdue', 'partial')),
  payment_date DATE,
  
  pdf_url TEXT,
  xml_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_b2b_invoices_client ON b2b_invoices(client_id);
CREATE INDEX idx_b2b_invoices_status ON b2b_invoices(payment_status);
CREATE INDEX idx_b2b_invoices_due_date ON b2b_invoices(due_date);

-- 6. TABELLA DOCUMENTI
CREATE TABLE IF NOT EXISTS b2b_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES b2b_clients(id) ON DELETE CASCADE,
  
  document_name TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('contract', 'invoice', 'proposal', 'certificate', 'identity', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_b2b_documents_client ON b2b_documents(client_id);
CREATE INDEX idx_b2b_documents_type ON b2b_documents(document_type);

-- 7. TABELLA TASK / TO-DO
CREATE TABLE IF NOT EXISTS b2b_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES b2b_clients(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  category TEXT CHECK (category IN ('sales', 'support', 'technical', 'administrative', 'other')),
  
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_b2b_tasks_status ON b2b_tasks(status);
CREATE INDEX idx_b2b_tasks_due_date ON b2b_tasks(due_date);
CREATE INDEX idx_b2b_tasks_client ON b2b_tasks(client_id);

-- 8. TABELLA NOTE
CREATE TABLE IF NOT EXISTS b2b_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES b2b_clients(id) ON DELETE CASCADE,
  
  note_text TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'call', 'meeting', 'important')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_b2b_notes_client ON b2b_notes(client_id);
CREATE INDEX idx_b2b_notes_created_at ON b2b_notes(created_at DESC);

-- 9. TABELLA MOVIMENTI CASSA
CREATE TABLE IF NOT EXISTS b2b_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  transaction_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  
  client_id UUID REFERENCES b2b_clients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES b2b_invoices(id) ON DELETE SET NULL,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_b2b_transactions_date ON b2b_transactions(transaction_date);
CREATE INDEX idx_b2b_transactions_type ON b2b_transactions(transaction_type);
CREATE INDEX idx_b2b_transactions_client ON b2b_transactions(client_id);

-- 10. MIGLIORAMENTO TABELLA ACCESS_CODES (aggiungi campi)
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS notes TEXT;

-- 11. RLS (Row Level Security) - Solo admin possono accedere
ALTER TABLE b2b_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Solo admin
CREATE POLICY "Admin can do everything on b2b_clients" ON b2b_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can do everything on b2b_contacts" ON b2b_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can do everything on b2b_contracts" ON b2b_contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can do everything on b2b_appointments" ON b2b_appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can do everything on b2b_invoices" ON b2b_invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can do everything on b2b_documents" ON b2b_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can do everything on b2b_tasks" ON b2b_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can do everything on b2b_notes" ON b2b_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can do everything on b2b_transactions" ON b2b_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- 12. TRIGGER per updated_at automatico
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_b2b_clients_updated_at BEFORE UPDATE ON b2b_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_b2b_contracts_updated_at BEFORE UPDATE ON b2b_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_b2b_invoices_updated_at BEFORE UPDATE ON b2b_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. VISTE UTILI

-- Vista pipeline CRM
CREATE OR REPLACE VIEW v_crm_pipeline AS
SELECT 
  status,
  COUNT(*) as count,
  SUM(COALESCE(potential_students_year, 0) * 59) as estimated_value
FROM b2b_clients
WHERE NOT archived
GROUP BY status;

-- Vista fatture scadute
CREATE OR REPLACE VIEW v_overdue_invoices AS
SELECT 
  i.*,
  c.business_name,
  (CURRENT_DATE - i.due_date) as days_overdue
FROM b2b_invoices i
JOIN b2b_clients c ON i.client_id = c.id
WHERE i.payment_status IN ('unpaid', 'partial')
  AND i.due_date < CURRENT_DATE
ORDER BY i.due_date ASC;

-- Vista contratti in scadenza
CREATE OR REPLACE VIEW v_expiring_contracts AS
SELECT 
  ct.*,
  c.business_name,
  c.email,
  c.phone,
  (ct.end_date - CURRENT_DATE) as days_until_expiry
FROM b2b_contracts ct
JOIN b2b_clients c ON ct.client_id = c.id
WHERE ct.status = 'active'
  AND ct.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
ORDER BY ct.end_date ASC;

-- Vista appuntamenti prossimi
CREATE OR REPLACE VIEW v_upcoming_appointments AS
SELECT 
  a.*,
  c.business_name
FROM b2b_appointments a
JOIN b2b_clients c ON a.client_id = c.id
WHERE a.status = 'scheduled'
  AND a.appointment_date >= NOW()
ORDER BY a.appointment_date ASC;

-- FINE SCHEMA
