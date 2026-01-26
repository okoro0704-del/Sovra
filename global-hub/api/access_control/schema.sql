-- TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
-- SOVRA_Sovereign_Kernel - Access Control Database Schema
--
-- Database schema for professional access control system
-- Supports certified professionals, consent management, and consultation contracts

-- ============================================================================
-- CERTIFIED PROFESSIONALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS certified_professionals (
  professional_id TEXT PRIMARY KEY,
  did TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('lawyer', 'auditor', 'architect')),
  license_number TEXT NOT NULL,
  issuing_authority TEXT NOT NULL,
  license_expiry TIMESTAMP NOT NULL,
  verification_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  specializations TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_professionals_did ON certified_professionals(did);
CREATE INDEX idx_professionals_role ON certified_professionals(role);
CREATE INDEX idx_professionals_active ON certified_professionals(is_active);

-- ============================================================================
-- ACCESS CONSENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS access_consents (
  consent_id TEXT PRIMARY KEY,
  citizen_did TEXT NOT NULL,
  professional_did TEXT NOT NULL,
  professional_role TEXT NOT NULL,
  granted_fields TEXT[] NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  granted_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  biometric_signature BYTEA NOT NULL,
  FOREIGN KEY (professional_did) REFERENCES certified_professionals(did)
);

CREATE INDEX idx_consents_citizen ON access_consents(citizen_did);
CREATE INDEX idx_consents_professional ON access_consents(professional_did);
CREATE INDEX idx_consents_active ON access_consents(is_active);
CREATE INDEX idx_consents_expires ON access_consents(expires_at);

-- ============================================================================
-- CITIZEN METADATA (Encrypted)
-- ============================================================================

CREATE TABLE IF NOT EXISTS citizen_metadata (
  did TEXT PRIMARY KEY,
  encrypted_data TEXT NOT NULL,
  available_fields TEXT[] NOT NULL,
  last_updated TIMESTAMP NOT NULL
);

CREATE INDEX idx_metadata_did ON citizen_metadata(did);

-- ============================================================================
-- CONSULTATION CONTRACTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS consultation_contracts (
  contract_id TEXT PRIMARY KEY,
  citizen_did TEXT NOT NULL,
  professional_did TEXT NOT NULL,
  professional_role TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  fee BIGINT NOT NULL,
  escrow_balance BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'disputed', 'cancelled', 'refunded')),
  created_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  delivery_proof TEXT,
  citizen_signature BYTEA,
  dispute_reason TEXT,
  FOREIGN KEY (professional_did) REFERENCES certified_professionals(did)
);

CREATE INDEX idx_contracts_citizen ON consultation_contracts(citizen_did);
CREATE INDEX idx_contracts_professional ON consultation_contracts(professional_did);
CREATE INDEX idx_contracts_status ON consultation_contracts(status);
CREATE INDEX idx_contracts_created ON consultation_contracts(created_at);

-- ============================================================================
-- METADATA ACCESS LOG (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS metadata_access_log (
  access_id TEXT PRIMARY KEY,
  citizen_did TEXT NOT NULL,
  professional_did TEXT NOT NULL,
  consent_id TEXT NOT NULL,
  requested_fields TEXT[] NOT NULL,
  granted_fields TEXT[] NOT NULL,
  access_status TEXT NOT NULL,
  access_timestamp TIMESTAMP NOT NULL,
  FOREIGN KEY (consent_id) REFERENCES access_consents(consent_id)
);

CREATE INDEX idx_access_log_citizen ON metadata_access_log(citizen_did);
CREATE INDEX idx_access_log_professional ON metadata_access_log(professional_did);
CREATE INDEX idx_access_log_timestamp ON metadata_access_log(access_timestamp);

-- ============================================================================
-- CONSULTATION PAYMENTS (Transaction History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS consultation_payments (
  payment_id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  from_did TEXT NOT NULL,
  to_did TEXT NOT NULL,
  amount BIGINT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('escrow_lock', 'payment_release', 'refund')),
  transaction_hash TEXT,
  timestamp TIMESTAMP NOT NULL,
  FOREIGN KEY (contract_id) REFERENCES consultation_contracts(contract_id)
);

CREATE INDEX idx_payments_contract ON consultation_payments(contract_id);
CREATE INDEX idx_payments_from ON consultation_payments(from_did);
CREATE INDEX idx_payments_to ON consultation_payments(to_did);
CREATE INDEX idx_payments_timestamp ON consultation_payments(timestamp);

-- ============================================================================
-- PROFESSIONAL STATISTICS (Performance Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS professional_statistics (
  professional_did TEXT PRIMARY KEY,
  total_consultations INTEGER DEFAULT 0,
  completed_consultations INTEGER DEFAULT 0,
  disputed_consultations INTEGER DEFAULT 0,
  total_revenue BIGINT DEFAULT 0,
  average_rating DECIMAL(3,2),
  last_consultation_date TIMESTAMP,
  FOREIGN KEY (professional_did) REFERENCES certified_professionals(did)
);

CREATE INDEX idx_stats_rating ON professional_statistics(average_rating);
CREATE INDEX idx_stats_completed ON professional_statistics(completed_consultations);

