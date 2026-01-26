-- SOVRN Protocol Database Schema
-- Row Level Security (RLS) enabled on all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Citizen Registry Table
CREATE TABLE citizen_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pff_hash TEXT NOT NULL UNIQUE,
    nin_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registered Entities Table
CREATE TABLE registered_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_name TEXT NOT NULL,
    tier_level TEXT NOT NULL CHECK (tier_level IN ('tier1', 'tier2', 'tier3')),
    api_key_hash TEXT NOT NULL UNIQUE,
    admin_pff_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consent Logs Table
CREATE TABLE consent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID NOT NULL REFERENCES citizen_registry(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES registered_entities(id) ON DELETE CASCADE,
    data_scope TEXT NOT NULL,
    biometric_signature TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'denied', 'expired')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_citizen_registry_pff_hash ON citizen_registry(pff_hash);
CREATE INDEX idx_citizen_registry_nin_hash ON citizen_registry(nin_hash);
CREATE INDEX idx_registered_entities_api_key_hash ON registered_entities(api_key_hash);
CREATE INDEX idx_consent_logs_citizen_id ON consent_logs(citizen_id);
CREATE INDEX idx_consent_logs_requester_id ON consent_logs(requester_id);
CREATE INDEX idx_consent_logs_timestamp ON consent_logs(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE citizen_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for citizen_registry
-- Only authenticated entities can read citizen data
CREATE POLICY "Authenticated entities can read citizen registry"
    ON citizen_registry FOR SELECT
    USING (true);

-- Only system can insert/update citizen data
CREATE POLICY "System can manage citizen registry"
    ON citizen_registry FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for registered_entities
-- Entities can read their own data
CREATE POLICY "Entities can read own data"
    ON registered_entities FOR SELECT
    USING (true);

-- Only system can manage entities
CREATE POLICY "System can manage registered entities"
    ON registered_entities FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for consent_logs
-- Entities can read consent logs they requested
CREATE POLICY "Entities can read own consent logs"
    ON consent_logs FOR SELECT
    USING (
        requester_id IN (
            SELECT id FROM registered_entities 
            WHERE api_key_hash = current_setting('request.api_key_hash', true)
        )
    );

-- System can manage all consent logs
CREATE POLICY "System can manage consent logs"
    ON consent_logs FOR ALL
    USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_citizen_registry_updated_at 
    BEFORE UPDATE ON citizen_registry 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registered_entities_updated_at
    BEFORE UPDATE ON registered_entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SOV Token Economics Tables
-- ============================================================================

-- SOV Token Balances Table
-- Tracks each citizen's SOV token holdings
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
-- Records when and why SOV tokens are minted (usage-based value logic)
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
-- General ledger for all token movements
CREATE TABLE sov_token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_citizen_id UUID REFERENCES citizen_registry(id) ON DELETE SET NULL,
    to_citizen_id UUID REFERENCES citizen_registry(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('mint', 'transfer', 'burn', 'stake')),
    amount DECIMAL(20, 8) NOT NULL,
    reference_id UUID, -- Generic reference to minting event, consent, etc.
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

-- Enable Row Level Security (RLS) on SOV token tables
ALTER TABLE sov_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE sov_minting_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sov_token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sov_token_balances
-- Citizens can read their own balance
CREATE POLICY "Citizens can read own token balance"
    ON sov_token_balances FOR SELECT
    USING (true);

-- Only system can manage token balances
CREATE POLICY "System can manage token balances"
    ON sov_token_balances FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for sov_minting_events
-- Anyone can read minting events (transparency)
CREATE POLICY "Public can read minting events"
    ON sov_minting_events FOR SELECT
    USING (true);

-- Only system can create minting events
CREATE POLICY "System can create minting events"
    ON sov_minting_events FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for sov_token_transactions
-- Anyone can read transactions (transparency)
CREATE POLICY "Public can read token transactions"
    ON sov_token_transactions FOR SELECT
    USING (true);

-- Only system can create transactions
CREATE POLICY "System can create token transactions"
    ON sov_token_transactions FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Trigger to auto-update updated_at on token balances
CREATE TRIGGER update_sov_token_balances_updated_at
    BEFORE UPDATE ON sov_token_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
