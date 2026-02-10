-- Multi-National Reserves: country_code column for routing 5 VIDA to the correct National Block.
-- The 5 VIDA flow to the specific record for the user's detected country (via get_citizen_nationality).

CREATE TABLE IF NOT EXISTS national_reserves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code TEXT NOT NULL UNIQUE,
    vault_address TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_country_code CHECK (length(country_code) = 2)
);

CREATE INDEX idx_national_reserves_country_code ON national_reserves(country_code);

ALTER TABLE national_reserves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage national_reserves"
    ON national_reserves FOR ALL
    USING (auth.role() = 'service_role');

-- Seed placeholder records for Nigeria, Ghana, UK (spokes can add more)
INSERT INTO national_reserves (country_code, vault_address, name) VALUES
    ('NG', '0xNIGERIA_BLOCK_PLACEHOLDER', 'Nigeria National Block'),
    ('GH', '0xGHANA_BLOCK_PLACEHOLDER', 'Ghana National Block'),
    ('GB', '0xUK_BLOCK_PLACEHOLDER', 'UK National Block')
ON CONFLICT (country_code) DO NOTHING;

-- Extend sovryn_release_ledger for multi-national: country_code and national_block_address
ALTER TABLE sovryn_release_ledger
    ADD COLUMN IF NOT EXISTS country_code TEXT,
    ADD COLUMN IF NOT EXISTS national_block_address TEXT;

COMMENT ON TABLE national_reserves IS 'Multi-national reserves: 5 VIDA routed by country_code from get_citizen_nationality()';
