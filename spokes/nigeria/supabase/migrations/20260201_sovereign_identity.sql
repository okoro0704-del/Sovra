-- Sovereign Identity Table Migration
-- Created: 2026-02-01
-- Purpose: Initialize Sovereign Identity Table with Genesis Hash from Root Pair

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SOVEREIGN IDENTITY TABLE
-- ============================================================================
-- Stores Genesis Hash from Root Pair (4-Layer Biometric Master Template)
-- This is the ONLY source of truth for Sovereign Identity

CREATE TABLE sovereign_identity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User identification
    user_address TEXT NOT NULL UNIQUE,
    did TEXT NOT NULL UNIQUE,
    
    -- Genesis Hash from Root Pair (4-Layer Biometric Capture)
    genesis_hash TEXT NOT NULL UNIQUE,
    root_pair_hash TEXT NOT NULL UNIQUE,
    
    -- 4-Layer Biometric Hashes (Face, Finger, Heart, Voice)
    face_hash TEXT NOT NULL,
    finger_hash TEXT NOT NULL,
    heart_hash TEXT NOT NULL,
    voice_hash TEXT NOT NULL,
    
    -- Master Template Hash (Combined 4-Layer Hash)
    master_template_hash TEXT NOT NULL,
    
    -- Device-Bio-Chain (Hardware UUID Binding)
    laptop_uuid TEXT,
    mobile_uuid TEXT,
    device_bio_chain_hash TEXT,
    
    -- Sentinel Tier Information
    sentinel_tier INTEGER DEFAULT 0 CHECK (sentinel_tier IN (0, 1, 2, 3)),
    sentinel_activation_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- National Vault Binding
    iso3166_code TEXT NOT NULL,
    national_vault_address TEXT,
    
    -- Identity Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    is_initialized BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_genesis_hash CHECK (length(genesis_hash) = 66), -- 0x + 64 hex chars
    CONSTRAINT valid_root_pair_hash CHECK (length(root_pair_hash) = 66),
    CONSTRAINT valid_iso3166_code CHECK (length(iso3166_code) >= 2 AND length(iso3166_code) <= 3)
);

-- ============================================================================
-- SENTINEL PAYMENT GATEWAY TABLE
-- ============================================================================
-- Tracks Sentinel tier activations and revenue routing

CREATE TABLE sentinel_payment_gateway (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User identification
    user_address TEXT NOT NULL,
    sovereign_identity_id UUID REFERENCES sovereign_identity(id) ON DELETE CASCADE,
    
    -- Sentinel Tier Information
    tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
    price_usd DECIMAL(10, 2) NOT NULL,
    devices INTEGER NOT NULL,
    
    -- Revenue Split (50/50)
    to_national_escrow DECIMAL(10, 2) NOT NULL,
    to_citizen_block DECIMAL(10, 2) NOT NULL,
    
    -- National Vault Routing
    iso3166_code TEXT NOT NULL,
    national_vault_address TEXT,
    
    -- Payment Information
    payment_method TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    transaction_hash TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_tier_price CHECK (
        (tier = 1 AND price_usd = 20) OR
        (tier = 2 AND price_usd = 50) OR
        (tier = 3 AND price_usd = 1000)
    ),
    CONSTRAINT valid_revenue_split CHECK (to_national_escrow + to_citizen_block = price_usd),
    CONSTRAINT valid_50_50_split CHECK (to_national_escrow = to_citizen_block)
);

-- ============================================================================
-- ROOT PAIR REGISTRY TABLE
-- ============================================================================
-- Stores 4-Layer Biometric Master Templates (Root Pairs)

CREATE TABLE root_pair_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User identification
    user_address TEXT NOT NULL UNIQUE,
    sovereign_identity_id UUID REFERENCES sovereign_identity(id) ON DELETE CASCADE,
    
    -- Root Pair Hash (Master Template)
    root_pair_hash TEXT NOT NULL UNIQUE,
    
    -- 4-Layer Biometric Templates
    face_template JSONB NOT NULL,
    finger_template JSONB NOT NULL,
    heart_template JSONB NOT NULL,
    voice_template JSONB NOT NULL,
    
    -- Capture Metadata
    capture_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    capture_device TEXT,
    capture_location TEXT,
    
    -- Validation Status
    is_validated BOOLEAN NOT NULL DEFAULT false,
    validation_timestamp TIMESTAMP WITH TIME ZONE,
    validation_score DECIMAL(5, 2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_root_pair_hash CHECK (length(root_pair_hash) = 66),
    CONSTRAINT valid_validation_score CHECK (validation_score >= 0 AND validation_score <= 100)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Sovereign Identity indexes
CREATE INDEX idx_sovereign_identity_user_address ON sovereign_identity(user_address);
CREATE INDEX idx_sovereign_identity_did ON sovereign_identity(did);
CREATE INDEX idx_sovereign_identity_genesis_hash ON sovereign_identity(genesis_hash);
CREATE INDEX idx_sovereign_identity_root_pair_hash ON sovereign_identity(root_pair_hash);
CREATE INDEX idx_sovereign_identity_iso3166_code ON sovereign_identity(iso3166_code);
CREATE INDEX idx_sovereign_identity_sentinel_tier ON sovereign_identity(sentinel_tier);
CREATE INDEX idx_sovereign_identity_status ON sovereign_identity(status);

-- Sentinel Payment Gateway indexes
CREATE INDEX idx_sentinel_payment_gateway_user_address ON sentinel_payment_gateway(user_address);
CREATE INDEX idx_sentinel_payment_gateway_sovereign_identity_id ON sentinel_payment_gateway(sovereign_identity_id);
CREATE INDEX idx_sentinel_payment_gateway_tier ON sentinel_payment_gateway(tier);
CREATE INDEX idx_sentinel_payment_gateway_iso3166_code ON sentinel_payment_gateway(iso3166_code);
CREATE INDEX idx_sentinel_payment_gateway_payment_status ON sentinel_payment_gateway(payment_status);
CREATE INDEX idx_sentinel_payment_gateway_created_at ON sentinel_payment_gateway(created_at);

-- Root Pair Registry indexes
CREATE INDEX idx_root_pair_registry_user_address ON root_pair_registry(user_address);
CREATE INDEX idx_root_pair_registry_sovereign_identity_id ON root_pair_registry(sovereign_identity_id);
CREATE INDEX idx_root_pair_registry_root_pair_hash ON root_pair_registry(root_pair_hash);
CREATE INDEX idx_root_pair_registry_is_validated ON root_pair_registry(is_validated);
CREATE INDEX idx_root_pair_registry_capture_timestamp ON root_pair_registry(capture_timestamp);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE sovereign_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentinel_payment_gateway ENABLE ROW LEVEL SECURITY;
ALTER TABLE root_pair_registry ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sovereign_identity
CREATE POLICY "Service role can manage sovereign identity"
    ON sovereign_identity FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can read their own sovereign identity"
    ON sovereign_identity FOR SELECT
    USING (user_address = current_setting('request.jwt.claims', true)::json->>'user_address');

-- RLS Policies for sentinel_payment_gateway
CREATE POLICY "Service role can manage sentinel payments"
    ON sentinel_payment_gateway FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can read their own sentinel payments"
    ON sentinel_payment_gateway FOR SELECT
    USING (user_address = current_setting('request.jwt.claims', true)::json->>'user_address');

-- RLS Policies for root_pair_registry
CREATE POLICY "Service role can manage root pairs"
    ON root_pair_registry FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can read their own root pair"
    ON root_pair_registry FOR SELECT
    USING (user_address = current_setting('request.jwt.claims', true)::json->>'user_address');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_sovereign_identity_updated_at
    BEFORE UPDATE ON sovereign_identity
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sentinel_payment_gateway_updated_at
    BEFORE UPDATE ON sentinel_payment_gateway
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_root_pair_registry_updated_at
    BEFORE UPDATE ON root_pair_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert Genesis Identity (Architect: ISREAL OKORO)
-- This is a placeholder - actual genesis hash will be generated from 4-layer biometric capture
INSERT INTO sovereign_identity (
    user_address,
    did,
    genesis_hash,
    root_pair_hash,
    face_hash,
    finger_hash,
    heart_hash,
    voice_hash,
    master_template_hash,
    iso3166_code,
    sentinel_tier,
    status,
    metadata
) VALUES (
    '0xARCHITECT_ADDRESS_PLACEHOLDER',
    'did:sovra:ng:architect',
    '0xGENESIS_HASH_PLACEHOLDER_64_CHARS_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    '0xROOT_PAIR_HASH_PLACEHOLDER_64_CHARS_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    '0xFACE_HASH_PLACEHOLDER',
    '0xFINGER_HASH_PLACEHOLDER',
    '0xHEART_HASH_PLACEHOLDER',
    '0xVOICE_HASH_PLACEHOLDER',
    '0xMASTER_TEMPLATE_HASH_PLACEHOLDER',
    'NGA',
    0,
    'active',
    '{"architect": "ISREAL OKORO", "genesis": true, "born_in": "Lagos, Nigeria"}'::jsonb
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE sovereign_identity IS 'Sovereign Identity Table - Genesis Hash from Root Pair (4-Layer Biometric Master Template)';
COMMENT ON TABLE sentinel_payment_gateway IS 'Sentinel Payment Gateway - Revenue routing to National Vault and Citizen Block';
COMMENT ON TABLE root_pair_registry IS 'Root Pair Registry - 4-Layer Biometric Master Templates';

COMMENT ON COLUMN sovereign_identity.genesis_hash IS 'Genesis Hash from Root Pair - Unique identifier for Sovereign Identity';
COMMENT ON COLUMN sovereign_identity.root_pair_hash IS 'Root Pair Hash - 4-Layer Biometric Master Template Hash';
COMMENT ON COLUMN sovereign_identity.master_template_hash IS 'Master Template Hash - Combined 4-Layer Biometric Hash';

COMMENT ON COLUMN sentinel_payment_gateway.to_national_escrow IS '50% of payment routed to National Escrow';
COMMENT ON COLUMN sentinel_payment_gateway.to_citizen_block IS '50% of payment routed to Citizen Block';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Sovereign Identity Table Migration Complete';
    RAISE NOTICE 'Genesis Hash from Root Pair initialized';
    RAISE NOTICE 'Sentinel Payment Gateway configured';
    RAISE NOTICE 'Revenue routing: 50%% National Escrow / 50%% Citizen Block';
    RAISE NOTICE 'Born in Lagos, Nigeria. Built for Humanity.';
    RAISE NOTICE 'Architect: ISREAL OKORO';
END $$;

