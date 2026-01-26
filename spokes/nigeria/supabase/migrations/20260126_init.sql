-- SOVRN Protocol - Initial Migration
-- Created: 2026-01-26

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Citizen Registry Table
CREATE TABLE citizen_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pff_hash TEXT NOT NULL UNIQUE,
    nin_hash TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registered Entities Table
CREATE TABLE registered_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    api_key_hash TEXT NOT NULL UNIQUE,
    tier_level TEXT NOT NULL CHECK (tier_level IN ('tier1', 'tier2', 'tier3')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consent Logs Table
CREATE TABLE consent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID NOT NULL REFERENCES citizen_registry(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES registered_entities(id) ON DELETE CASCADE,
    biometric_signature TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_citizen_registry_pff_hash ON citizen_registry(pff_hash);
CREATE INDEX idx_registered_entities_api_key_hash ON registered_entities(api_key_hash);
CREATE INDEX idx_consent_logs_citizen_id ON consent_logs(citizen_id);
CREATE INDEX idx_consent_logs_entity_id ON consent_logs(entity_id);
CREATE INDEX idx_consent_logs_timestamp ON consent_logs(timestamp);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE citizen_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for citizen_registry
-- Allow service role to manage all records
CREATE POLICY "Service role can manage citizen registry"
    ON citizen_registry FOR ALL
    USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own records (if needed)
CREATE POLICY "Authenticated users can read citizen registry"
    ON citizen_registry FOR SELECT
    USING (auth.role() = 'authenticated');

-- RLS Policies for registered_entities
-- Allow service role to manage all records
CREATE POLICY "Service role can manage registered entities"
    ON registered_entities FOR ALL
    USING (auth.role() = 'service_role');

-- Allow authenticated users to read entities
CREATE POLICY "Authenticated users can read registered entities"
    ON registered_entities FOR SELECT
    USING (auth.role() = 'authenticated');

-- RLS Policies for consent_logs
-- Allow service role to manage all records
CREATE POLICY "Service role can manage consent logs"
    ON consent_logs FOR ALL
    USING (auth.role() = 'service_role');

-- Allow entities to read their own consent logs
CREATE POLICY "Entities can read own consent logs"
    ON consent_logs FOR SELECT
    USING (
        entity_id IN (
            SELECT id FROM registered_entities
            WHERE auth.role() = 'authenticated'
        )
    );

-- ============================================================================
-- SOV Token Economics Tables
-- ============================================================================

-- SOV Token Balances Table
CREATE TABLE sov_token_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID NOT NULL REFERENCES citizen_registry(id) ON DELETE CASCADE,
    balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    staked_balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(citizen_id)
);

-- SOV Token Minting Events Table
CREATE TABLE sov_minting_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID NOT NULL REFERENCES citizen_registry(id) ON DELETE CASCADE,
    consent_id UUID REFERENCES consent_logs(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('pff_verification', 'consent_granted', 'manual_mint')),
    amount DECIMAL(20, 8) NOT NULL,
    pff_verification_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SOV Token Transactions Table
CREATE TABLE sov_token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_citizen_id UUID REFERENCES citizen_registry(id) ON DELETE SET NULL,
    to_citizen_id UUID REFERENCES citizen_registry(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('mint', 'transfer', 'burn', 'stake')),
    amount DECIMAL(20, 8) NOT NULL,
    reference_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for SOV token tables
CREATE INDEX idx_sov_token_balances_citizen_id ON sov_token_balances(citizen_id);
CREATE INDEX idx_sov_minting_events_citizen_id ON sov_minting_events(citizen_id);
CREATE INDEX idx_sov_minting_events_consent_id ON sov_minting_events(consent_id);
CREATE INDEX idx_sov_minting_events_minted_at ON sov_minting_events(minted_at);
CREATE INDEX idx_sov_token_transactions_from_citizen ON sov_token_transactions(from_citizen_id);
CREATE INDEX idx_sov_token_transactions_to_citizen ON sov_token_transactions(to_citizen_id);
CREATE INDEX idx_sov_token_transactions_timestamp ON sov_token_transactions(timestamp);

-- Enable RLS on SOV token tables
ALTER TABLE sov_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE sov_minting_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sov_token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sov_token_balances
CREATE POLICY "Service role can manage token balances"
    ON sov_token_balances FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can read token balances"
    ON sov_token_balances FOR SELECT
    USING (true);

-- RLS Policies for sov_minting_events
CREATE POLICY "Service role can create minting events"
    ON sov_minting_events FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public can read minting events"
    ON sov_minting_events FOR SELECT
    USING (true);

-- RLS Policies for sov_token_transactions
CREATE POLICY "Service role can create token transactions"
    ON sov_token_transactions FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public can read token transactions"
    ON sov_token_transactions FOR SELECT
    USING (true);
