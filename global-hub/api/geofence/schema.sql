-- ============================================================================
-- SOVRA_Sovereign_Kernel - Geofenced Security Protocol Database Schema
-- ============================================================================

-- Security Zones Table
-- Stores geographic boundaries and security requirements
CREATE TABLE IF NOT EXISTS security_zones (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(255) NOT NULL,
    lga VARCHAR(255), -- Local Government Area (Nigeria-specific)
    
    -- Geographic boundaries (stored as GeoJSON polygon)
    boundaries JSONB NOT NULL,
    
    -- Security configuration
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    required_pff_level INTEGER NOT NULL CHECK (required_pff_level BETWEEN 1 AND 3),
    watchlist_monitoring BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    
    -- Indexes
    INDEX idx_country (country),
    INDEX idx_risk_level (risk_level),
    INDEX idx_watchlist_monitoring (watchlist_monitoring)
);

-- Watchlist Table
-- Stores flagged DIDs requiring enhanced monitoring
CREATE TABLE IF NOT EXISTS watchlist (
    did VARCHAR(255) PRIMARY KEY,
    reason TEXT NOT NULL,
    threat_level VARCHAR(20) NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
    added_by VARCHAR(255) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    metadata JSONB,
    
    -- Indexes
    INDEX idx_threat_level (threat_level),
    INDEX idx_added_at (added_at),
    INDEX idx_expires_at (expires_at)
);

-- Security Alerts Table
-- Logs all security alerts triggered by watchlist DIDs
CREATE TABLE IF NOT EXISTS security_alerts (
    alert_id VARCHAR(100) PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Subject information
    did VARCHAR(255) NOT NULL,
    threat_level VARCHAR(20) NOT NULL,
    
    -- Location information
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_name VARCHAR(255),
    security_zone_id VARCHAR(50),
    
    -- Context
    reason TEXT,
    verification_id VARCHAR(100),
    
    -- Encryption
    encrypted_payload TEXT NOT NULL,
    iv VARCHAR(255) NOT NULL,
    
    -- Status
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP,
    
    -- Indexes
    INDEX idx_did (did),
    INDEX idx_timestamp (timestamp),
    INDEX idx_threat_level (threat_level),
    INDEX idx_security_zone (security_zone_id),
    INDEX idx_acknowledged (acknowledged),
    
    -- Foreign keys
    FOREIGN KEY (security_zone_id) REFERENCES security_zones(id) ON DELETE SET NULL
);

-- Geofence Verification Log
-- Logs all verification attempts with geofencing results
CREATE TABLE IF NOT EXISTS geofence_verification_log (
    id SERIAL PRIMARY KEY,
    verification_id VARCHAR(100) NOT NULL,
    did VARCHAR(255) NOT NULL,
    
    -- Location
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_name VARCHAR(255),
    
    -- Geofence results
    in_security_zone BOOLEAN NOT NULL,
    security_zone_id VARCHAR(50),
    required_pff_level INTEGER NOT NULL,
    
    -- Watchlist
    on_watchlist BOOLEAN NOT NULL,
    alert_triggered BOOLEAN NOT NULL,
    alert_id VARCHAR(100),
    
    -- Result
    passed BOOLEAN NOT NULL,
    reason TEXT,
    processing_time_ms INTEGER,
    
    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_verification_id (verification_id),
    INDEX idx_did (did),
    INDEX idx_created_at (created_at),
    INDEX idx_security_zone (security_zone_id),
    INDEX idx_alert_triggered (alert_triggered),
    
    -- Foreign keys
    FOREIGN KEY (security_zone_id) REFERENCES security_zones(id) ON DELETE SET NULL,
    FOREIGN KEY (alert_id) REFERENCES security_alerts(alert_id) ON DELETE SET NULL
);

-- Movement Challenges Table
-- Stores Level 3 PFF movement challenges
CREATE TABLE IF NOT EXISTS movement_challenges (
    challenge_id VARCHAR(100) PRIMARY KEY,
    verification_id VARCHAR(100) NOT NULL,
    did VARCHAR(255) NOT NULL,
    
    -- Challenge details
    instructions JSONB NOT NULL,
    expected_duration INTEGER NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
    completed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    
    -- Indexes
    INDEX idx_verification_id (verification_id),
    INDEX idx_did (did),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for security_zones
CREATE TRIGGER update_security_zones_updated_at
    BEFORE UPDATE ON security_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

