-- Vaults table: required by Supabase triggers / other services.
-- Standalone: no REFERENCES to other tables so it runs even if sovereign_identity/citizens don't exist yet.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS vaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Optional IDs (no FK so this migration is standalone)
    sovereign_identity_id UUID,
    citizen_id UUID,
    vault_address TEXT NOT NULL,
    vault_type TEXT NOT NULL DEFAULT 'citizen_block' CHECK (vault_type IN ('national_block', 'citizen_block', 'architect', 'foundation', 'escrow', 'other')),
    country_code TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vaults_vault_address ON vaults(vault_address);
CREATE INDEX idx_vaults_sovereign_identity_id ON vaults(sovereign_identity_id);
CREATE INDEX idx_vaults_citizen_id ON vaults(citizen_id);
CREATE INDEX idx_vaults_vault_type ON vaults(vault_type);
CREATE INDEX idx_vaults_country_code ON vaults(country_code);

ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage vaults"
    ON vaults FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated can read vaults"
    ON vaults FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE TRIGGER update_vaults_updated_at
    BEFORE UPDATE ON vaults
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE vaults IS 'Vault registry; standalone migration, no dependency on sovereign_identity or citizens';
