-- System entities: PFF_GLOBAL_FOUNDATION and PFF_SENTINEL_V1
-- Standalone: creates registered_entities if missing, then inserts foundation + sentinel.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table if not exist (so script works when init migration hasn't run)
CREATE TABLE IF NOT EXISTS registered_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    api_key_hash TEXT NOT NULL UNIQUE,
    tier_level TEXT NOT NULL CHECK (tier_level IN ('tier1', 'tier2', 'tier3')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add optional columns (for existing table or for table we just created)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'registered_entities' AND column_name = 'wallet_address') THEN
    ALTER TABLE registered_entities ADD COLUMN wallet_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'registered_entities' AND column_name = 'status') THEN
    ALTER TABLE registered_entities ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked'));
  END IF;
END $$;

-- Foundation entry: PFF_GLOBAL_FOUNDATION with master foundation wallet (update wallet_address in dashboard to your foundation address)
INSERT INTO registered_entities (name, api_key_hash, tier_level, wallet_address, status)
SELECT 'PFF_GLOBAL_FOUNDATION', encode(digest('PFF_GLOBAL_FOUNDATION_SYSTEM_KEY', 'sha256'), 'hex'), 'tier1', '0xFOUNDATION_PLACEHOLDER', 'active'
WHERE NOT EXISTS (SELECT 1 FROM registered_entities WHERE name = 'PFF_GLOBAL_FOUNDATION');

-- Sentinel entry: PFF_SENTINEL_V1 with unique secret (generate hash; set SENTINEL_SECRET in env and hash it in dashboard for api_key_hash)
INSERT INTO registered_entities (name, api_key_hash, tier_level, status)
SELECT 'PFF_SENTINEL_V1', encode(digest(gen_random_uuid()::text, 'sha256'), 'hex'), 'tier1', 'active'
WHERE NOT EXISTS (SELECT 1 FROM registered_entities WHERE name = 'PFF_SENTINEL_V1');

-- Update Foundation wallet from placeholder if you have a column (run in dashboard or second migration)
-- UPDATE registered_entities SET wallet_address = '0xYourFoundationAddress' WHERE name = 'PFF_GLOBAL_FOUNDATION';

-- RLS: Protocol permissions for vaults and consent_logs
-- The API uses service_role when acting for PFF_GLOBAL_FOUNDATION / PFF_SENTINEL_V1; ensure service_role has full access.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vaults') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vaults' AND policyname = 'Service role can manage vaults') THEN
      CREATE POLICY "Service role can manage vaults" ON vaults FOR ALL USING (auth.role() = 'service_role');
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consent_logs') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'consent_logs' AND policyname = 'Service role can manage consent logs') THEN
      CREATE POLICY "Service role can manage consent logs" ON consent_logs FOR ALL USING (auth.role() = 'service_role');
    END IF;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN registered_entities.wallet_address IS 'Optional: for PFF_GLOBAL_FOUNDATION, the master foundation wallet address';
COMMENT ON COLUMN registered_entities.status IS 'active = entity can be used for protocol operations';
