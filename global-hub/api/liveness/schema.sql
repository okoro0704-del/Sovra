-- ============================================================================
-- SOVRN Hub - Liveness Attestation Schema
-- ============================================================================
-- This schema supports:
-- - Liveness attestation storage
-- - Blockchain anchoring
-- - Privacy-preserving verification
-- - Device tracking
-- ============================================================================

-- Liveness Attestations
CREATE TABLE liveness_attestations (
  attestation_id SERIAL PRIMARY KEY,
  attestation_hash TEXT UNIQUE NOT NULL,
  
  -- Liveness result
  liveness_confirmed BOOLEAN NOT NULL,
  overall_confidence DECIMAL(5, 4) NOT NULL CHECK (overall_confidence >= 0 AND overall_confidence <= 1),
  
  -- Component hashes (NOT raw biometric data)
  texture_hash TEXT NOT NULL,
  pulse_hash TEXT NOT NULL,
  
  -- Device information (hashed for privacy)
  device_id TEXT NOT NULL,
  npu_model TEXT NOT NULL,
  
  -- Timestamps
  capture_timestamp BIGINT NOT NULL,
  analysis_timestamp BIGINT NOT NULL,
  anchored_at BIGINT NOT NULL,
  
  -- Blockchain anchoring
  transaction_hash TEXT NOT NULL,
  block_height BIGINT NOT NULL,
  blockchain_verified BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_attestation_hash (attestation_hash),
  INDEX idx_device_id (device_id),
  INDEX idx_transaction_hash (transaction_hash),
  INDEX idx_block_height (block_height),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_liveness_confirmed (liveness_confirmed)
);

-- Device Attestation History
CREATE TABLE device_attestation_history (
  history_id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  npu_model TEXT NOT NULL,
  
  -- Attestation statistics
  total_attestations INT NOT NULL DEFAULT 0,
  successful_attestations INT NOT NULL DEFAULT 0,
  failed_attestations INT NOT NULL DEFAULT 0,
  
  -- Confidence statistics
  avg_confidence DECIMAL(5, 4),
  min_confidence DECIMAL(5, 4),
  max_confidence DECIMAL(5, 4),
  
  -- Timestamps
  first_attestation_at TIMESTAMP,
  last_attestation_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_device_history (device_id),
  INDEX idx_last_attestation (last_attestation_at DESC)
);

-- Attestation Analytics (Materialized View)
CREATE MATERIALIZED VIEW attestation_analytics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_attestations,
  COUNT(*) FILTER (WHERE liveness_confirmed = true) as successful_attestations,
  COUNT(*) FILTER (WHERE liveness_confirmed = false) as failed_attestations,
  AVG(overall_confidence) as avg_confidence,
  COUNT(DISTINCT device_id) as unique_devices,
  COUNT(DISTINCT npu_model) as unique_npu_models
FROM liveness_attestations
GROUP BY DATE_TRUNC('day', created_at);

CREATE INDEX idx_attestation_analytics_date ON attestation_analytics(date DESC);

-- Refresh attestation analytics (run daily)
-- REFRESH MATERIALIZED VIEW attestation_analytics;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to record liveness attestation
CREATE OR REPLACE FUNCTION record_liveness_attestation(
  p_attestation_hash TEXT,
  p_liveness_confirmed BOOLEAN,
  p_overall_confidence DECIMAL,
  p_texture_hash TEXT,
  p_pulse_hash TEXT,
  p_device_id TEXT,
  p_npu_model TEXT,
  p_capture_timestamp BIGINT,
  p_analysis_timestamp BIGINT,
  p_transaction_hash TEXT,
  p_block_height BIGINT
) RETURNS VOID AS $$
BEGIN
  -- Insert attestation
  INSERT INTO liveness_attestations (
    attestation_hash,
    liveness_confirmed,
    overall_confidence,
    texture_hash,
    pulse_hash,
    device_id,
    npu_model,
    capture_timestamp,
    analysis_timestamp,
    anchored_at,
    transaction_hash,
    block_height
  ) VALUES (
    p_attestation_hash,
    p_liveness_confirmed,
    p_overall_confidence,
    p_texture_hash,
    p_pulse_hash,
    p_device_id,
    p_npu_model,
    p_capture_timestamp,
    p_analysis_timestamp,
    EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000,
    p_transaction_hash,
    p_block_height
  );
  
  -- Update device history
  INSERT INTO device_attestation_history (
    device_id,
    npu_model,
    total_attestations,
    successful_attestations,
    failed_attestations,
    avg_confidence,
    min_confidence,
    max_confidence,
    first_attestation_at,
    last_attestation_at
  ) VALUES (
    p_device_id,
    p_npu_model,
    1,
    CASE WHEN p_liveness_confirmed THEN 1 ELSE 0 END,
    CASE WHEN p_liveness_confirmed THEN 0 ELSE 1 END,
    p_overall_confidence,
    p_overall_confidence,
    p_overall_confidence,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (device_id) DO UPDATE SET
    total_attestations = device_attestation_history.total_attestations + 1,
    successful_attestations = device_attestation_history.successful_attestations + 
      CASE WHEN p_liveness_confirmed THEN 1 ELSE 0 END,
    failed_attestations = device_attestation_history.failed_attestations + 
      CASE WHEN p_liveness_confirmed THEN 0 ELSE 1 END,
    avg_confidence = (device_attestation_history.avg_confidence * device_attestation_history.total_attestations + p_overall_confidence) / 
      (device_attestation_history.total_attestations + 1),
    min_confidence = LEAST(device_attestation_history.min_confidence, p_overall_confidence),
    max_confidence = GREATEST(device_attestation_history.max_confidence, p_overall_confidence),
    last_attestation_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Privacy Notes
-- ============================================================================
-- 
-- IMPORTANT: This schema stores ONLY attestation hashes, NOT raw biometric data
-- 
-- What is stored:
-- ✅ Attestation hash (SHA-256 of liveness result)
-- ✅ Texture hash (SHA-256 of texture analysis metrics)
-- ✅ Pulse hash (SHA-256 of pulse detection metrics)
-- ✅ Device ID (hashed)
-- ✅ Pass/Fail result
-- ✅ Confidence scores
-- 
-- What is NOT stored:
-- ❌ Raw biometric video frames
-- ❌ Raw facial images
-- ❌ Raw pulse waveforms
-- ❌ Unhashed device identifiers
-- ❌ Any personally identifiable information (PII)
-- 
-- All raw biometric data is processed locally on-device and deleted immediately
-- after analysis. Only cryptographic hashes are transmitted to the Hub.
-- ============================================================================

