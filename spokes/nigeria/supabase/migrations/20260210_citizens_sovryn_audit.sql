-- Citizens table for SOVRYN Audit & Minting Release
-- Created: 2026-02-10
-- Purpose: Store citizen state for SOVRYN control (is_vitalized, minting_status)
--          and identify Architect for Force Audit / releaseVidaCap()

CREATE TABLE IF NOT EXISTS citizens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid TEXT NOT NULL UNIQUE,
    did TEXT,
    vault_address TEXT,
    is_vitalized BOOLEAN NOT NULL DEFAULT false,
    minting_status TEXT CHECK (minting_status IN ('PENDING', 'COMPLETED', 'FAILED', 'SKIPPED')),
    is_architect BOOLEAN NOT NULL DEFAULT false,
    sovereign_identity_id UUID REFERENCES sovereign_identity(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_citizens_uid ON citizens(uid);
CREATE INDEX idx_citizens_is_architect ON citizens(is_architect);
CREATE INDEX idx_citizens_is_vitalized ON citizens(is_vitalized);
CREATE INDEX idx_citizens_minting_status ON citizens(minting_status);
CREATE INDEX idx_citizens_sovereign_identity_id ON citizens(sovereign_identity_id);

ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage citizens"
    ON citizens FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated can read citizens"
    ON citizens FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE TRIGGER update_citizens_updated_at
    BEFORE UPDATE ON citizens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed Architect from sovereign_identity (single Architect row for SOVRYN audit)
INSERT INTO citizens (uid, did, vault_address, is_vitalized, minting_status, is_architect, sovereign_identity_id, metadata)
SELECT
    si.user_address,
    si.did,
    si.national_vault_address,
    true,
    NULL,
    true,
    si.id,
    si.metadata
FROM sovereign_identity si
WHERE si.did = 'did:sovra:ng:architect'
ON CONFLICT (uid) DO NOTHING;

-- Ledger for SOVRYN releaseVidaCap() executions (on-ledger confirmation)
CREATE TABLE IF NOT EXISTS sovryn_release_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_uid TEXT NOT NULL,
    architect_vault_address TEXT NOT NULL,
    nigeria_block_address TEXT NOT NULL,
    foundation_address TEXT NOT NULL,
    total_minted DECIMAL(20, 8) NOT NULL DEFAULT 11,
    to_architect DECIMAL(20, 8) NOT NULL DEFAULT 5,
    to_nigeria_block DECIMAL(20, 8) NOT NULL DEFAULT 5,
    to_foundation DECIMAL(20, 8) NOT NULL DEFAULT 1,
    transaction_hash TEXT,
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sovryn_release_ledger_citizen_uid ON sovryn_release_ledger(citizen_uid);
ALTER TABLE sovryn_release_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage sovryn_release_ledger"
    ON sovryn_release_ledger FOR ALL
    USING (auth.role() = 'service_role');

COMMENT ON TABLE citizens IS 'Citizens table for SOVRYN Audit; Architect row drives releaseVidaCap() when is_vitalized AND minting_status IS NULL';
COMMENT ON TABLE sovryn_release_ledger IS 'SOVRYN releaseVidaCap() ledger: 11 VIDA = 5 Architect + 5 Nigeria Block + 1 Foundation';
