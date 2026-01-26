-- ============================================================================
-- SOVRN Hub - Fraud Detection Schema
-- ============================================================================
-- This schema supports:
-- - Velocity tracking (impossible travel detection)
-- - Hardware attestation (bot detection)
-- - AI liveness scoring (deepfake detection)
-- - Fraud event logging
-- - Challenge tracking
-- ============================================================================

-- Fraud Events Log
CREATE TABLE fraud_events (
  event_id TEXT PRIMARY KEY,
  verification_id TEXT NOT NULL,
  did TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('velocity_check', 'hardware_attestation', 'liveness_check', 'fraud_check')),
  result TEXT NOT NULL CHECK (result IN ('passed', 'failed', 'requires_step_up', 'rejected')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('none', 'low', 'medium', 'high', 'critical')),
  fraud_flags JSONB,
  details JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_fraud_events_did (did),
  INDEX idx_fraud_events_verification (verification_id),
  INDEX idx_fraud_events_type (event_type),
  INDEX idx_fraud_events_result (result),
  INDEX idx_fraud_events_timestamp (timestamp DESC)
);

-- Velocity Tracking
CREATE TABLE velocity_tracking (
  tracking_id SERIAL PRIMARY KEY,
  did TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location TEXT NOT NULL,
  verification_id TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Previous location (for analysis)
  previous_latitude DECIMAL(10, 8),
  previous_longitude DECIMAL(11, 8),
  previous_location TEXT,
  previous_timestamp TIMESTAMP,
  
  -- Velocity analysis
  distance_km DECIMAL(10, 2),
  time_delta_minutes DECIMAL(10, 2),
  required_speed_kmh DECIMAL(10, 2),
  impossible_travel BOOLEAN DEFAULT false,
  
  INDEX idx_velocity_did (did),
  INDEX idx_velocity_timestamp (timestamp DESC),
  INDEX idx_velocity_impossible (impossible_travel)
);

-- Hardware Attestation Log
CREATE TABLE hardware_attestation_log (
  attestation_id SERIAL PRIMARY KEY,
  verification_id TEXT NOT NULL,
  did TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_model TEXT,
  os_version TEXT,
  
  -- Security indicators
  has_secure_enclave BOOLEAN NOT NULL,
  is_rooted BOOLEAN NOT NULL,
  is_jailbroken BOOLEAN NOT NULL,
  is_emulator BOOLEAN NOT NULL,
  is_virtual_machine BOOLEAN NOT NULL,
  developer_mode_on BOOLEAN NOT NULL,
  
  -- Biometric capabilities
  has_face_id BOOLEAN,
  has_touch_id BOOLEAN,
  has_iris_scanner BOOLEAN,
  has_fingerprint_sensor BOOLEAN,
  
  -- Attestation result
  attestation_passed BOOLEAN NOT NULL,
  trust_level TEXT NOT NULL CHECK (trust_level IN ('high', 'medium', 'low', 'untrusted')),
  security_flags JSONB,
  
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_hardware_did (did),
  INDEX idx_hardware_device (device_fingerprint),
  INDEX idx_hardware_passed (attestation_passed),
  INDEX idx_hardware_trust (trust_level),
  INDEX idx_hardware_timestamp (timestamp DESC)
);

-- Liveness Scoring Log
CREATE TABLE liveness_scoring_log (
  liveness_id SERIAL PRIMARY KEY,
  verification_id TEXT NOT NULL,
  did TEXT NOT NULL,
  
  -- Confidence scores
  human_texture_confidence DECIMAL(5, 4) NOT NULL,
  skin_texture_score DECIMAL(5, 4),
  micro_movement_score DECIMAL(5, 4),
  depth_map_consistency DECIMAL(5, 4),
  reflection_analysis DECIMAL(5, 4),
  frame_consistency DECIMAL(5, 4),
  motion_naturalness DECIMAL(5, 4),
  overall_confidence DECIMAL(5, 4) NOT NULL,
  
  -- Detection results
  blood_flow_detected BOOLEAN NOT NULL,
  deepfake_risk TEXT NOT NULL CHECK (deepfake_risk IN ('none', 'low', 'medium', 'high', 'critical')),
  
  -- Result
  liveness_passed BOOLEAN NOT NULL,
  requires_challenge BOOLEAN NOT NULL,
  
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_liveness_did (did),
  INDEX idx_liveness_passed (liveness_passed),
  INDEX idx_liveness_risk (deepfake_risk),
  INDEX idx_liveness_timestamp (timestamp DESC),
  
  CONSTRAINT valid_confidence CHECK (overall_confidence >= 0 AND overall_confidence <= 1)
);

-- Liveness Challenges
CREATE TABLE liveness_challenges (
  challenge_id TEXT PRIMARY KEY,
  verification_id TEXT NOT NULL,
  did TEXT NOT NULL,
  
  -- Challenge details
  challenge_type TEXT NOT NULL,
  instructions TEXT NOT NULL,
  timeout_seconds INT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  challenge_response TEXT,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  
  INDEX idx_challenges_did (did),
  INDEX idx_challenges_verification (verification_id),
  INDEX idx_challenges_status (status),
  INDEX idx_challenges_created (created_at DESC)
);

-- Fraud Statistics (Materialized View)
CREATE MATERIALIZED VIEW fraud_statistics AS
SELECT
  DATE_TRUNC('day', timestamp) as date,
  event_type,
  result,
  risk_level,
  COUNT(*) as event_count,
  COUNT(DISTINCT did) as unique_dids,
  COUNT(DISTINCT verification_id) as unique_verifications
FROM fraud_events
GROUP BY DATE_TRUNC('day', timestamp), event_type, result, risk_level;

CREATE INDEX idx_fraud_stats_date ON fraud_statistics(date DESC);

-- Refresh fraud statistics (run daily)
-- REFRESH MATERIALIZED VIEW fraud_statistics;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to record fraud event
CREATE OR REPLACE FUNCTION record_fraud_event(
  p_event_id TEXT,
  p_verification_id TEXT,
  p_did TEXT,
  p_event_type TEXT,
  p_result TEXT,
  p_risk_level TEXT,
  p_fraud_flags JSONB,
  p_details JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO fraud_events (
    event_id, verification_id, did, event_type, result, risk_level, fraud_flags, details
  ) VALUES (
    p_event_id, p_verification_id, p_did, p_event_type, p_result, p_risk_level, p_fraud_flags, p_details
  );
END;
$$ LANGUAGE plpgsql;

