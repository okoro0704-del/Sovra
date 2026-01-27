-- TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
--
-- Database schema for Proxy Payment Protocol
-- This schema supports third-party fee payments and Vitalian record tracking

-- ============================================================================
-- PROXY PAYMENTS TABLE
-- ============================================================================
-- Stores all proxy payment transactions where a third party (airport, airline)
-- pays PFF verification fees on behalf of a traveler

CREATE TABLE IF NOT EXISTS proxy_payments (
    transaction_id VARCHAR(255) PRIMARY KEY,
    traveler_did VARCHAR(255) NOT NULL,
    proxy_did VARCHAR(255) NOT NULL,
    fee_amount BIGINT NOT NULL,
    proxy_balance_before BIGINT NOT NULL,
    proxy_balance_after BIGINT NOT NULL,
    four_pillars_split BOOLEAN NOT NULL DEFAULT TRUE,
    vitalian_record_id VARCHAR(255) NOT NULL,
    pff_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for efficient querying
    INDEX idx_traveler_did (traveler_did),
    INDEX idx_proxy_did (proxy_did),
    INDEX idx_created_at (created_at),
    INDEX idx_vitalian_record (vitalian_record_id)
);

-- ============================================================================
-- VITALIAN RECORDS TABLE
-- ============================================================================
-- Stores traveler verification records independently of payment method
-- This ensures travel history stays clean even when airport paid

CREATE TABLE IF NOT EXISTS vitalian_records (
    record_id VARCHAR(255) PRIMARY KEY,
    traveler_did VARCHAR(255) NOT NULL,
    verification_status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    proxy_did VARCHAR(255),
    transaction_id VARCHAR(255) NOT NULL,
    pff_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for efficient querying
    INDEX idx_traveler_did (traveler_did),
    INDEX idx_verification_status (verification_status),
    INDEX idx_payment_method (payment_method),
    INDEX idx_created_at (created_at),
    
    -- Foreign key to proxy_payments (if proxy payment)
    FOREIGN KEY (transaction_id) REFERENCES proxy_payments(transaction_id) ON DELETE CASCADE
);

-- ============================================================================
-- BALANCE CHECK LOG TABLE
-- ============================================================================
-- Logs all balance checks for audit trail and analytics

CREATE TABLE IF NOT EXISTS balance_check_log (
    check_id VARCHAR(255) PRIMARY KEY,
    user_did VARCHAR(255) NOT NULL,
    required_fee BIGINT NOT NULL,
    current_balance BIGINT NOT NULL,
    has_sufficient_funds BOOLEAN NOT NULL,
    status VARCHAR(50) NOT NULL,
    shortfall BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for efficient querying
    INDEX idx_user_did (user_did),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- PROXY PAYMENT STATISTICS VIEW
-- ============================================================================
-- Aggregated statistics for proxy payments by proxy entity

CREATE OR REPLACE VIEW proxy_payment_stats AS
SELECT
    proxy_did,
    COUNT(*) AS total_payments,
    SUM(fee_amount) AS total_fees_paid,
    AVG(fee_amount) AS avg_fee_amount,
    COUNT(DISTINCT traveler_did) AS unique_travelers,
    MIN(created_at) AS first_payment,
    MAX(created_at) AS last_payment
FROM proxy_payments
GROUP BY proxy_did;

-- ============================================================================
-- TRAVELER VERIFICATION HISTORY VIEW
-- ============================================================================
-- Complete verification history for travelers

CREATE OR REPLACE VIEW traveler_verification_history AS
SELECT
    vr.record_id,
    vr.traveler_did,
    vr.verification_status,
    vr.payment_method,
    vr.proxy_did,
    vr.transaction_id,
    vr.pff_hash,
    vr.created_at,
    pp.fee_amount,
    pp.proxy_balance_before,
    pp.proxy_balance_after
FROM vitalian_records vr
LEFT JOIN proxy_payments pp ON vr.transaction_id = pp.transaction_id
ORDER BY vr.created_at DESC;

-- ============================================================================
-- INSUFFICIENT FUNDS ANALYTICS VIEW
-- ============================================================================
-- Tracks how often travelers need proxy payments due to insufficient funds

CREATE OR REPLACE VIEW insufficient_funds_analytics AS
SELECT
    DATE(created_at) AS date,
    COUNT(*) AS total_checks,
    SUM(CASE WHEN status = 'insufficient_funds_proxy_required' THEN 1 ELSE 0 END) AS insufficient_count,
    SUM(CASE WHEN status = 'sufficient_funds' THEN 1 ELSE 0 END) AS sufficient_count,
    ROUND(100.0 * SUM(CASE WHEN status = 'insufficient_funds_proxy_required' THEN 1 ELSE 0 END) / COUNT(*), 2) AS insufficient_percentage
FROM balance_check_log
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE proxy_payments IS 'Stores proxy payment transactions where third parties pay PFF fees on behalf of travelers';
COMMENT ON TABLE vitalian_records IS 'Stores traveler verification records independently of payment method';
COMMENT ON TABLE balance_check_log IS 'Logs all balance checks for audit trail and analytics';

COMMENT ON COLUMN proxy_payments.traveler_did IS 'DID of the traveler being verified';
COMMENT ON COLUMN proxy_payments.proxy_did IS 'DID of the entity paying (airport, airline, etc.)';
COMMENT ON COLUMN proxy_payments.four_pillars_split IS 'Confirms ExecuteFourWaySplit was triggered';

COMMENT ON COLUMN vitalian_records.verification_status IS 'Status: verified_passage_success';
COMMENT ON COLUMN vitalian_records.payment_method IS 'Payment method: self or proxy';
COMMENT ON COLUMN vitalian_records.proxy_did IS 'DID of proxy payer (NULL if self-payment)';

