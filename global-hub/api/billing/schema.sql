-- SOVRN Hub - Billing Gateway Database Schema
-- This schema supports fiat-to-SOV purchases, wallets, and escrow

-- ============================================================================
-- Sovereign Wallets
-- ============================================================================

CREATE TABLE sovereign_wallets (
  user_id TEXT PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('individual', 'enterprise')),
  regular_balance BIGINT NOT NULL DEFAULT 0,  -- uSOV - can be withdrawn
  escrow_balance BIGINT NOT NULL DEFAULT 0,   -- uSOV - restricted to PFF fees
  total_balance BIGINT NOT NULL DEFAULT 0,    -- regular + escrow
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT positive_regular_balance CHECK (regular_balance >= 0),
  CONSTRAINT positive_escrow_balance CHECK (escrow_balance >= 0),
  CONSTRAINT total_balance_check CHECK (total_balance = regular_balance + escrow_balance)
);

CREATE INDEX idx_wallets_user_type ON sovereign_wallets(user_type);
CREATE INDEX idx_wallets_created_at ON sovereign_wallets(created_at);

-- ============================================================================
-- Wallet Transactions
-- ============================================================================

CREATE TABLE wallet_transactions (
  transaction_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES sovereign_wallets(user_id),
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('regular', 'escrow')),
  amount BIGINT NOT NULL,                     -- uSOV
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  purpose TEXT NOT NULL,                      -- 'fiat_purchase', 'pff_fee', 'withdrawal', etc.
  metadata JSONB,                             -- Additional transaction data
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_transactions_timestamp ON wallet_transactions(timestamp DESC);
CREATE INDEX idx_transactions_purpose ON wallet_transactions(purpose);
CREATE INDEX idx_transactions_wallet_type ON wallet_transactions(wallet_type);

-- ============================================================================
-- Purchase Orders
-- ============================================================================

CREATE TABLE purchase_orders (
  purchase_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES sovereign_wallets(user_id),
  user_type TEXT NOT NULL,
  currency TEXT NOT NULL,                     -- USD, NGN, EUR, GBP
  fiat_amount DECIMAL(20, 2) NOT NULL,
  exchange_rate DECIMAL(20, 6) NOT NULL,      -- uSOV per fiat unit
  usov_amount BIGINT NOT NULL,
  sov_amount DECIMAL(20, 6) NOT NULL,
  wallet_type TEXT NOT NULL,                  -- 'regular', 'escrow'
  payment_method TEXT NOT NULL,               -- 'card', 'bank_transfer', 'mobile_money'
  payment_details JSONB,
  transaction_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT positive_fiat_amount CHECK (fiat_amount > 0),
  CONSTRAINT positive_exchange_rate CHECK (exchange_rate > 0),
  CONSTRAINT positive_usov_amount CHECK (usov_amount > 0)
);

CREATE INDEX idx_purchases_user_id ON purchase_orders(user_id);
CREATE INDEX idx_purchases_status ON purchase_orders(status);
CREATE INDEX idx_purchases_created_at ON purchase_orders(created_at DESC);
CREATE INDEX idx_purchases_currency ON purchase_orders(currency);

-- ============================================================================
-- Exchange Rates History
-- ============================================================================

CREATE TABLE exchange_rates_history (
  id SERIAL PRIMARY KEY,
  currency TEXT NOT NULL,
  usov_per_unit DECIMAL(20, 6) NOT NULL,
  sov_per_unit DECIMAL(20, 6) NOT NULL,
  source TEXT NOT NULL,                       -- 'SOVRN_ORACLE_V1', 'CHAINLINK', etc.
  confidence DECIMAL(3, 2) NOT NULL,          -- 0.00 to 1.00
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT positive_rate CHECK (usov_per_unit > 0),
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX idx_rates_currency ON exchange_rates_history(currency);
CREATE INDEX idx_rates_timestamp ON exchange_rates_history(timestamp DESC);

-- ============================================================================
-- Escrow Restrictions Log
-- ============================================================================

CREATE TABLE escrow_restrictions_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES sovereign_wallets(user_id),
  attempted_action TEXT NOT NULL,             -- 'withdrawal', 'transfer', etc.
  attempted_amount BIGINT NOT NULL,
  escrow_balance BIGINT NOT NULL,
  rejection_reason TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_escrow_log_user_id ON escrow_restrictions_log(user_id);
CREATE INDEX idx_escrow_log_timestamp ON escrow_restrictions_log(timestamp DESC);

-- ============================================================================
-- PFF Fee Payments
-- ============================================================================

CREATE TABLE pff_fee_payments (
  payment_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES sovereign_wallets(user_id),
  verification_id TEXT NOT NULL,
  fee_amount BIGINT NOT NULL,                 -- uSOV
  paid_from_escrow BIGINT NOT NULL DEFAULT 0,
  paid_from_regular BIGINT NOT NULL DEFAULT 0,
  transaction_id TEXT REFERENCES wallet_transactions(transaction_id),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT positive_fee CHECK (fee_amount > 0),
  CONSTRAINT fee_split_check CHECK (paid_from_escrow + paid_from_regular = fee_amount)
);

CREATE INDEX idx_pff_payments_user_id ON pff_fee_payments(user_id);
CREATE INDEX idx_pff_payments_verification_id ON pff_fee_payments(verification_id);
CREATE INDEX idx_pff_payments_timestamp ON pff_fee_payments(timestamp DESC);

-- ============================================================================
-- Views for Analytics
-- ============================================================================

-- Wallet summary view
CREATE VIEW wallet_summary AS
SELECT 
  user_type,
  COUNT(*) as total_wallets,
  SUM(regular_balance) as total_regular_balance,
  SUM(escrow_balance) as total_escrow_balance,
  SUM(total_balance) as total_balance,
  AVG(regular_balance) as avg_regular_balance,
  AVG(escrow_balance) as avg_escrow_balance
FROM sovereign_wallets
GROUP BY user_type;

-- Purchase summary view
CREATE VIEW purchase_summary AS
SELECT 
  currency,
  COUNT(*) as total_purchases,
  SUM(fiat_amount) as total_fiat_amount,
  SUM(usov_amount) as total_usov_amount,
  AVG(exchange_rate) as avg_exchange_rate,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_purchases,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_purchases
FROM purchase_orders
GROUP BY currency;

-- ============================================================================
-- Functions
-- ============================================================================

-- Update wallet updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_update_timestamp
BEFORE UPDATE ON sovereign_wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallet_timestamp();

-- ============================================================================
-- Multi-Party Settlement Tables
-- ============================================================================

-- Corporate Nodes (Airports and Airlines)
CREATE TABLE corporate_nodes (
  node_id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL CHECK (node_type IN ('airport', 'airline')),
  name TEXT NOT NULL,
  iata_code TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  wallet_id TEXT NOT NULL REFERENCES sovereign_wallets(user_id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_corporate_nodes_type ON corporate_nodes(node_type);
CREATE INDEX idx_corporate_nodes_iata ON corporate_nodes(iata_code);
CREATE INDEX idx_corporate_nodes_country ON corporate_nodes(country);

-- Multi-Party Transactions
CREATE TABLE multi_party_transactions (
  transaction_id TEXT PRIMARY KEY,
  verification_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('AIRPORT_CHECKPOINT', 'BOARDING_GATE', 'DUAL_PURPOSE')),
  total_amount_usov BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'failed')),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,

  CONSTRAINT positive_total_amount CHECK (total_amount_usov > 0)
);

CREATE INDEX idx_mp_transactions_verification ON multi_party_transactions(verification_id);
CREATE INDEX idx_mp_transactions_event_type ON multi_party_transactions(event_type);
CREATE INDEX idx_mp_transactions_status ON multi_party_transactions(status);
CREATE INDEX idx_mp_transactions_timestamp ON multi_party_transactions(timestamp DESC);

-- Payer Allocations (who pays what in each transaction)
CREATE TABLE payer_allocations (
  allocation_id SERIAL PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES multi_party_transactions(transaction_id),
  payer_id TEXT NOT NULL REFERENCES corporate_nodes(node_id),
  payer_type TEXT NOT NULL CHECK (payer_type IN ('airport', 'airline')),
  amount_usov BIGINT NOT NULL,
  percentage DECIMAL(5, 4) NOT NULL,
  event_type TEXT NOT NULL,
  wallet_transaction_id TEXT REFERENCES wallet_transactions(transaction_id),

  CONSTRAINT positive_amount CHECK (amount_usov > 0),
  CONSTRAINT valid_percentage CHECK (percentage > 0 AND percentage <= 1)
);

CREATE INDEX idx_payer_allocations_transaction ON payer_allocations(transaction_id);
CREATE INDEX idx_payer_allocations_payer ON payer_allocations(payer_id);
CREATE INDEX idx_payer_allocations_type ON payer_allocations(payer_type);

-- Event Pricing Rules
CREATE TABLE event_pricing_rules (
  event_type TEXT PRIMARY KEY CHECK (event_type IN ('AIRPORT_CHECKPOINT', 'BOARDING_GATE', 'DUAL_PURPOSE')),
  base_amount_usov BIGINT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT positive_base_amount CHECK (base_amount_usov > 0)
);

-- Insert default pricing rules
INSERT INTO event_pricing_rules (event_type, base_amount_usov, description) VALUES
  ('AIRPORT_CHECKPOINT', 1000000, 'Security checkpoint verification - billed to airport'),
  ('BOARDING_GATE', 10000000, 'Boarding gate verification - billed to airline'),
  ('DUAL_PURPOSE', 11000000, 'Dual-purpose verification - split between airport and airline');

-- Monthly Invoices
CREATE TABLE monthly_invoices (
  invoice_id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES corporate_nodes(node_id),
  billing_period TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  total_amount_usov BIGINT NOT NULL,
  total_sov DECIMAL(20, 6) NOT NULL,
  total_transactions INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'finalized' CHECK (status IN ('draft', 'finalized', 'paid')),
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,

  CONSTRAINT unique_node_period UNIQUE (node_id, billing_period),
  CONSTRAINT positive_total CHECK (total_amount_usov >= 0)
);

CREATE INDEX idx_invoices_node ON monthly_invoices(node_id);
CREATE INDEX idx_invoices_period ON monthly_invoices(billing_period);
CREATE INDEX idx_invoices_status ON monthly_invoices(status);
CREATE INDEX idx_invoices_due_date ON monthly_invoices(due_date);

-- Invoice Line Items
CREATE TABLE invoice_line_items (
  line_item_id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES monthly_invoices(invoice_id),
  transaction_id TEXT NOT NULL REFERENCES multi_party_transactions(transaction_id),
  verification_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  amount_usov BIGINT NOT NULL,
  percentage DECIMAL(5, 4),
  description TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,

  CONSTRAINT positive_line_amount CHECK (amount_usov > 0)
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_line_items_transaction ON invoice_line_items(transaction_id);
CREATE INDEX idx_line_items_event_type ON invoice_line_items(event_type);

-- Invoice Event Breakdown (summary by event type)
CREATE TABLE invoice_event_breakdown (
  id SERIAL PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES monthly_invoices(invoice_id),
  event_type TEXT NOT NULL,
  count INT NOT NULL,
  total_amount_usov BIGINT NOT NULL,
  total_sov DECIMAL(20, 6) NOT NULL,

  CONSTRAINT unique_invoice_event UNIQUE (invoice_id, event_type)
);

CREATE INDEX idx_event_breakdown_invoice ON invoice_event_breakdown(invoice_id);

-- ============================================================================
-- Multi-Party Views
-- ============================================================================

-- Corporate node summary
CREATE VIEW corporate_node_summary AS
SELECT
  cn.node_id,
  cn.name,
  cn.node_type,
  cn.iata_code,
  COUNT(DISTINCT mpt.transaction_id) as total_transactions,
  SUM(pa.amount_usov) as total_billed_usov,
  SUM(pa.amount_usov) / 1000000.0 as total_billed_sov,
  COUNT(DISTINCT mi.invoice_id) as total_invoices
FROM corporate_nodes cn
LEFT JOIN payer_allocations pa ON cn.node_id = pa.payer_id
LEFT JOIN multi_party_transactions mpt ON pa.transaction_id = mpt.transaction_id
LEFT JOIN monthly_invoices mi ON cn.node_id = mi.node_id
GROUP BY cn.node_id, cn.name, cn.node_type, cn.iata_code;

-- Transaction summary by event type
CREATE VIEW transaction_summary_by_event AS
SELECT
  event_type,
  COUNT(*) as total_transactions,
  SUM(total_amount_usov) as total_revenue_usov,
  SUM(total_amount_usov) / 1000000.0 as total_revenue_sov,
  AVG(total_amount_usov) as avg_amount_usov,
  COUNT(CASE WHEN status = 'settled' THEN 1 END) as settled_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM multi_party_transactions
GROUP BY event_type;

