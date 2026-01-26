# SOVRA Hub - Fraud Orchestrator
## Unified Presence & Sovereignty Protocol

## 🎯 Overview

The **Fraud Orchestrator** is a comprehensive fraud detection system that protects the **SOVRA Protocol** (Sovereign Presence Architecture) from identity fraud, bot attacks, and deepfake impersonation. It combines three powerful detection mechanisms:

1. **Velocity Check** - Detects impossible travel patterns
2. **Hardware Attestation** - Ensures scans come from secure physical devices
3. **AI Liveness Scoring** - Detects deepfakes and synthetic biometric data

### Key Features

✅ **Impossible Travel Detection** - Flags DIDs attempting verifications faster than physically possible  
✅ **Bot Detection** - Rejects scans from emulators, VMs, and rooted/jailbroken devices  
✅ **Deepfake Detection** - AI-powered analysis with 99.9% confidence threshold  
✅ **Random Challenges** - Dynamic liveness challenges (e.g., "Look left, then blink twice")  
✅ **Manual Step-Up** - Requires secondary biometric (voice) for suspicious activity  
✅ **Real-Time Analysis** - Sub-second fraud detection  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Fraud Orchestrator                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Velocity   │  │   Hardware   │  │  AI Liveness │         │
│  │    Check     │  │ Attestation  │  │   Scoring    │         │
│  │              │  │              │  │              │         │
│  │ - Haversine  │  │ - Secure     │  │ - Deepfake   │         │
│  │   Distance   │  │   Enclave    │  │   Detection  │         │
│  │ - Max Speed  │  │ - Bot        │  │ - 99.9%      │         │
│  │   990 km/h   │  │   Detection  │  │   Threshold  │         │
│  │ - Step-Up:   │  │ - Reject:    │  │ - Random     │         │
│  │   Voice      │  │   Emulators  │  │   Challenges │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                │
│         └──────────────────┴──────────────────┘                │
│                            │                                   │
│                            ▼                                   │
│                  ┌──────────────────┐                          │
│                  │  Fraud Check     │                          │
│                  │  Result          │                          │
│                  │                  │                          │
│                  │ - Passed         │                          │
│                  │ - Rejected       │                          │
│                  │ - Requires       │                          │
│                  │   Step-Up        │                          │
│                  └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Fraud Detection Mechanisms

### 1. Velocity Check

**Purpose**: Detect impossible travel patterns

**How It Works**:
1. Track verification locations (latitude/longitude)
2. Calculate distance between consecutive verifications (Haversine formula)
3. Calculate required travel speed
4. Compare against maximum plane speed (990 km/h)
5. Flag if travel is physically impossible

**Example**:
```
Verification 1: JFK Airport, New York (40.6413°N, 73.7781°W) at 10:00 AM
Verification 2: LAX Airport, Los Angeles (33.9416°N, 118.4085°W) at 10:30 AM

Distance: ~3,944 km
Time: 30 minutes
Required Speed: 7,888 km/h
Max Plane Speed: 990 km/h

Result: IMPOSSIBLE TRAVEL → Requires Voice Biometric Step-Up
```

**Step-Up Action**: Require voice biometric verification

---

### 2. Hardware Attestation

**Purpose**: Ensure PFF scans come from secure physical devices

**Security Checks**:
- ✅ **Secure Enclave** - iOS Secure Enclave or Android StrongBox/TEE required
- ❌ **Emulators** - Reject all emulator scans
- ❌ **Virtual Machines** - Reject all VM scans
- ❌ **Rooted Devices** - Reject rooted Android devices
- ❌ **Jailbroken Devices** - Reject jailbroken iOS devices
- ⚠️ **Developer Mode** - Flag but allow

**Attestation Verification**:
- iOS: DeviceCheck API + App Attest
- Android: SafetyNet Attestation API / Play Integrity API

**Example**:
```json
{
  "device_fingerprint": "abc123...",
  "has_secure_enclave": true,
  "is_emulator": false,
  "is_rooted": false,
  "has_face_id": true,
  "attestation_token": "signed_by_apple..."
}

Result: PASSED - High Trust Level
```

**Rejection Example**:
```json
{
  "is_emulator": true
}

Result: REJECTED - "Emulator detected - PFF scans must come from physical devices"
```

---

### 3. AI Liveness Scoring

**Purpose**: Detect deepfakes and synthetic biometric data

**Analysis Metrics**:
- **Human Texture Confidence** (25% weight) - Skin micro-texture analysis
- **Skin Texture Score** (15% weight) - Pore and wrinkle detection
- **Micro-Movement Score** (15% weight) - Natural breathing and pulse
- **Depth Map Consistency** (15% weight) - 3D depth analysis
- **Reflection Analysis** (10% weight) - Eye reflection patterns
- **Frame Consistency** (10% weight) - Temporal consistency
- **Motion Naturalness** (10% weight) - Natural motion patterns

**Confidence Threshold**: 99.9% (0.999)

**Blood Flow Detection**: Infrared blood flow must be detected

**Example**:
```json
{
  "human_texture_confidence": 0.995,
  "skin_texture_score": 0.998,
  "micro_movement_score": 0.997,
  "depth_map_consistency": 0.999,
  "reflection_analysis": 0.996,
  "frame_consistency": 0.998,
  "motion_naturalness": 0.997,
  "blood_flow_detected": true
}

Overall Confidence: 99.7%
Result: PASSED (above 99.9% threshold)
```

**Low Confidence Example**:
```json
{
  "human_texture_confidence": 0.985,
  "overall_confidence": 0.987
}

Result: REQUIRES CHALLENGE
Challenge: "Look left, then blink twice"
```

**Random Challenges**:
- "Look left, then blink twice"
- "Look right, then smile"
- "Tilt your head to the left"
- "Blink three times slowly"
- "Open your mouth, then close it"
- "Look up, then look down"

---

## 🔌 API Endpoints

### 1. Comprehensive Fraud Check

**Endpoint**: `POST /v1/fraud/check`

**Description**: Runs all three fraud detection mechanisms

**Request**:
```json
{
  "did": "did:sovrn:ng:abc123",
  "biometric_hash": "hash123...",
  "latitude": 40.6413,
  "longitude": -73.7781,
  "location": "JFK Airport, New York",
  "device_attestation": {
    "device_fingerprint": "device123",
    "attestation_token": "token...",
    "device_model": "iPhone 14 Pro",
    "os_version": "iOS 17.2",
    "has_secure_enclave": true,
    "is_rooted": false,
    "is_jailbroken": false,
    "is_emulator": false,
    "is_virtual_machine": false,
    "developer_mode_on": false,
    "has_face_id": true
  },
  "liveness_data": {
    "human_texture_confidence": 0.998,
    "skin_texture_score": 0.997,
    "micro_movement_score": 0.996,
    "depth_map_consistency": 0.999,
    "reflection_analysis": 0.995,
    "frame_consistency": 0.998,
    "motion_naturalness": 0.997,
    "blood_flow_detected": true
  },
  "verification_id": "ver-123"
}
```

**Response (Passed)**:
```json
{
  "passed": true,
  "rejected": false,
  "requires_step_up": false,
  "velocity_check": {
    "passed": true,
    "requires_step_up": false,
    "reason": "First verification for this DID"
  },
  "hardware_check": {
    "passed": true,
    "rejected": false,
    "reason": "Device attestation verified - secure hardware confirmed",
    "trust_level": "high"
  },
  "liveness_check": {
    "passed": true,
    "requires_challenge": false,
    "confidence_score": 0.997,
    "deepfake_risk": "none"
  },
  "overall_risk_level": "none",
  "fraud_flags": [],
  "processing_time_ms": 45
}
```

**Response (Requires Step-Up)**:
```json
{
  "passed": false,
  "rejected": false,
  "requires_step_up": true,
  "velocity_check": {
    "passed": false,
    "requires_step_up": true,
    "reason": "Impossible travel detected: 3944 km in 30 minutes requires 7888 km/h (max plane speed: 990 km/h)",
    "previous_location": "JFK Airport, New York",
    "current_location": "LAX Airport, Los Angeles",
    "distance_km": 3944.2,
    "time_delta_minutes": 30.0,
    "required_speed_kmh": 7888.4,
    "impossible_travel": true
  },
  "step_up_method": "voice_biometric",
  "overall_risk_level": "high",
  "fraud_flags": ["IMPOSSIBLE_TRAVEL"]
}
```

**Response (Requires Challenge)**:
```json
{
  "passed": false,
  "rejected": false,
  "requires_step_up": true,
  "liveness_check": {
    "passed": false,
    "requires_challenge": true,
    "confidence_score": 0.987,
    "deepfake_risk": "medium",
    "challenge": {
      "challenge_id": "challenge-1706284800000",
      "challenge_type": "look_left_blink_twice",
      "instructions": "Look left, then blink twice",
      "expires_at": "2026-01-26T12:00:10Z",
      "timeout": 10
    }
  },
  "step_up_method": "random_challenge",
  "overall_risk_level": "medium",
  "fraud_flags": ["LOW_LIVENESS_CONFIDENCE"]
}
```

---

### 2. Velocity Check Only

**Endpoint**: `POST /v1/fraud/velocity`

**Request**:
```json
{
  "did": "did:sovrn:ng:abc123",
  "latitude": 40.6413,
  "longitude": -73.7781,
  "location": "JFK Airport, New York"
}
```

**Response**:
```json
{
  "passed": true,
  "requires_step_up": false,
  "reason": "Travel velocity is physically possible",
  "previous_location": "Newark Airport, New Jersey",
  "current_location": "JFK Airport, New York",
  "distance_km": 25.3,
  "time_delta_minutes": 45.0,
  "required_speed_kmh": 33.7,
  "max_plane_speed_kmh": 990.0,
  "impossible_travel": false
}
```

---

### 3. Hardware Attestation Only

**Endpoint**: `POST /v1/fraud/hardware`

**Request**:
```json
{
  "device_fingerprint": "device123",
  "attestation_token": "token...",
  "device_model": "iPhone 14 Pro",
  "os_version": "iOS 17.2",
  "has_secure_enclave": true,
  "is_rooted": false,
  "is_jailbroken": false,
  "is_emulator": false,
  "is_virtual_machine": false,
  "developer_mode_on": false,
  "has_face_id": true
}
```

**Response**:
```json
{
  "passed": true,
  "rejected": false,
  "reason": "Device attestation verified - secure hardware confirmed",
  "trust_level": "high",
  "security_flags": [],
  "device_fingerprint": "device123"
}
```

---

### 4. AI Liveness Check Only

**Endpoint**: `POST /v1/fraud/liveness`

**Request**:
```json
{
  "human_texture_confidence": 0.998,
  "skin_texture_score": 0.997,
  "micro_movement_score": 0.996,
  "depth_map_consistency": 0.999,
  "reflection_analysis": 0.995,
  "frame_consistency": 0.998,
  "motion_naturalness": 0.997,
  "blood_flow_detected": true
}
```

**Response**:
```json
{
  "passed": true,
  "requires_challenge": false,
  "rejected": false,
  "reason": "Liveness verified - 99.70% confidence (threshold: 99.90%)",
  "confidence_score": 0.997,
  "deepfake_risk": "none",
  "analysis_details": {
    "human_texture_confidence": 0.998,
    "skin_texture_score": 0.997,
    "micro_movement_score": 0.996,
    "depth_map_consistency": 0.999,
    "reflection_analysis": 0.995,
    "frame_consistency": 0.998,
    "motion_naturalness": 0.997,
    "overall_confidence": 0.997
  }
}
```

---

### 5. Verify Challenge Response

**Endpoint**: `POST /v1/fraud/challenge/verify`

**Request**:
```json
{
  "challenge_id": "challenge-1706284800000",
  "challenge_response": "completed",
  "liveness_data": {
    "human_texture_confidence": 0.999,
    "skin_texture_score": 0.998,
    "micro_movement_score": 0.997,
    "depth_map_consistency": 0.999,
    "reflection_analysis": 0.996,
    "frame_consistency": 0.999,
    "motion_naturalness": 0.998,
    "blood_flow_detected": true,
    "challenge_completed": true,
    "challenge_type": "look_left_blink_twice",
    "challenge_response": "completed"
  }
}
```

**Response**:
```json
{
  "challenge_id": "challenge-1706284800000",
  "challenge_passed": true,
  "liveness_result": {
    "passed": true,
    "requires_challenge": false,
    "confidence_score": 0.998,
    "deepfake_risk": "none"
  }
}
```

---

## 📊 Use Cases

### Use Case 1: Normal Verification (All Checks Pass)

```
Scenario: Legitimate user at JFK Airport with iPhone 14 Pro

1. User scans biometric at JFK Airport
2. Fraud Orchestrator runs all checks:

   Velocity Check:
   - First verification for this DID
   - Result: PASSED

   Hardware Attestation:
   - iPhone 14 Pro with Secure Enclave
   - Face ID enabled
   - Not jailbroken, not emulator
   - Result: PASSED (High Trust)

   AI Liveness:
   - Confidence: 99.8%
   - Blood flow detected
   - Result: PASSED

3. Overall Result: PASSED
4. Verification proceeds normally
```

---

### Use Case 2: Impossible Travel Detected

```
Scenario: Fraudster attempts to use stolen identity

1. Verification 1: JFK Airport, New York at 10:00 AM
2. Verification 2: LAX Airport, Los Angeles at 10:30 AM

3. Velocity Check:
   - Distance: 3,944 km
   - Time: 30 minutes
   - Required Speed: 7,888 km/h
   - Max Plane Speed: 990 km/h
   - Result: IMPOSSIBLE TRAVEL

4. Overall Result: REQUIRES STEP-UP
5. Step-Up Method: Voice Biometric
6. User must provide voice sample for verification
7. Voice sample compared against stored voiceprint
8. If match: Verification proceeds
9. If no match: Verification REJECTED
```

---

### Use Case 3: Emulator Detected (Bot Attack)

```
Scenario: Attacker using Android emulator to spoof biometrics

1. Device Attestation:
   - Device: Android Emulator
   - Secure Enclave: Not detected
   - Emulator flag: TRUE

2. Hardware Attestation Result: REJECTED
3. Reason: "Emulator detected - PFF scans must come from physical devices"
4. Overall Result: REJECTED
5. Verification blocked immediately
6. Fraud event logged
```

---

### Use Case 4: Deepfake Detected (Low Liveness Confidence)

```
Scenario: Attacker using deepfake video

1. AI Liveness Analysis:
   - Human Texture Confidence: 98.5%
   - Overall Confidence: 98.7%
   - Threshold: 99.9%
   - Blood Flow: Detected (but weak)

2. Liveness Result: REQUIRES CHALLENGE
3. Random Challenge Generated: "Look left, then blink twice"
4. Challenge presented to user
5. User completes challenge
6. Re-analyze liveness with challenge response
7. New Confidence: 99.95%
8. Result: PASSED
9. Verification proceeds
```

---

### Use Case 5: Rooted Device Detected

```
Scenario: User with rooted Android phone

1. Device Attestation:
   - Device: Samsung Galaxy S23
   - Rooted: TRUE
   - Secure Enclave: Compromised

2. Hardware Attestation Result: REJECTED
3. Reason: "Rooted device detected - compromised security"
4. Overall Result: REJECTED
5. User notified: "Please use a non-rooted device for verification"
6. Verification blocked
```

---

## 🛠️ Integration Guide

### Go Integration

```go
package main

import (
    "context"
    "fmt"
    "github.com/sovrn-protocol/sovrn/hub/api/fraud"
)

func main() {
    // Create fraud orchestrator
    orchestrator := fraud.NewFraudOrchestrator()

    // Prepare verification request
    req := &fraud.VerificationRequest{
        DID:           "did:sovrn:ng:abc123",
        BiometricHash: "hash123...",
        Latitude:      40.6413,
        Longitude:     -73.7781,
        Location:      "JFK Airport, New York",
        DeviceAttestation: &fraud.DeviceAttestation{
            DeviceFingerprint: "device123",
            AttestationToken:  "token...",
            DeviceModel:       "iPhone 14 Pro",
            OSVersion:         "iOS 17.2",
            HasSecureEnclave:  true,
            IsRooted:          false,
            IsJailbroken:      false,
            IsEmulator:        false,
            IsVirtualMachine:  false,
            DeveloperModeOn:   false,
            HasFaceID:         true,
        },
        LivenessData: &fraud.LivenessData{
            HumanTextureConfidence: 0.998,
            SkinTextureScore:       0.997,
            MicroMovementScore:     0.996,
            DepthMapConsistency:    0.999,
            ReflectionAnalysis:     0.995,
            FrameConsistency:       0.998,
            MotionNaturalness:      0.997,
            BloodFlowDetected:      true,
        },
        VerificationID: "ver-123",
    }

    // Perform fraud check
    result, err := orchestrator.PerformFraudCheck(context.Background(), req)
    if err != nil {
        panic(err)
    }

    // Handle result
    if result.Rejected {
        fmt.Printf("Verification REJECTED: %s\n", result.VelocityCheck.Reason)
        return
    }

    if result.RequiresStepUp {
        fmt.Printf("Step-up required: %s\n", result.StepUpMethod)
        if result.Challenge != nil {
            fmt.Printf("Challenge: %s\n", result.Challenge.Instructions)
        }
        return
    }

    if result.Passed {
        fmt.Println("Fraud check PASSED - proceed with verification")
    }
}
```

---

### HTTP Integration (curl)

```bash
# Comprehensive fraud check
curl -X POST http://localhost:8080/v1/fraud/check \
  -H "Content-Type: application/json" \
  -d '{
    "did": "did:sovrn:ng:abc123",
    "biometric_hash": "hash123...",
    "latitude": 40.6413,
    "longitude": -73.7781,
    "location": "JFK Airport, New York",
    "device_attestation": {
      "device_fingerprint": "device123",
      "attestation_token": "token...",
      "has_secure_enclave": true,
      "is_emulator": false,
      "has_face_id": true
    },
    "liveness_data": {
      "human_texture_confidence": 0.998,
      "blood_flow_detected": true
    },
    "verification_id": "ver-123"
  }'
```

---

### Integration with FastTrackService

```go
package api

import (
    "context"
    "github.com/sovrn-protocol/sovrn/hub/api/fraud"
)

type FastTrackService struct {
    fraudOrchestrator *fraud.FraudOrchestrator
}

func (s *FastTrackService) VerifyTraveler(
    ctx context.Context,
    req *VerifyTravelerRequest,
) (*VerifyTravelerResponse, error) {

    // 1. Run fraud detection BEFORE biometric verification
    fraudReq := &fraud.VerificationRequest{
        DID:               req.DID,
        BiometricHash:     req.BiometricHash,
        Latitude:          req.Latitude,
        Longitude:         req.Longitude,
        Location:          req.Location,
        DeviceAttestation: req.DeviceAttestation,
        LivenessData:      req.LivenessData,
        VerificationID:    req.VerificationID,
    }

    fraudResult, err := s.fraudOrchestrator.PerformFraudCheck(ctx, fraudReq)
    if err != nil {
        return nil, err
    }

    // 2. Handle fraud detection result
    if fraudResult.Rejected {
        return &VerifyTravelerResponse{
            Verified:    false,
            Reason:      fraudResult.VelocityCheck.Reason,
            FraudFlags:  fraudResult.FraudFlags,
        }, nil
    }

    if fraudResult.RequiresStepUp {
        return &VerifyTravelerResponse{
            Verified:      false,
            RequiresStepUp: true,
            StepUpMethod:  fraudResult.StepUpMethod,
            Challenge:     fraudResult.Challenge,
        }, nil
    }

    // 3. Fraud check passed - proceed with biometric verification
    // ... existing verification logic ...

    return &VerifyTravelerResponse{
        Verified: true,
    }, nil
}
```

---

## 📚 Database Schema Reference

### Tables

**fraud_events** - Fraud event log
- `event_id` - Unique event identifier
- `verification_id` - Associated verification ID
- `did` - Decentralized identifier
- `event_type` - Type of fraud check (velocity_check, hardware_attestation, liveness_check, fraud_check)
- `result` - Result (passed, failed, requires_step_up, rejected)
- `risk_level` - Risk level (none, low, medium, high, critical)
- `fraud_flags` - JSON array of fraud flags
- `details` - JSON object with detailed results

**velocity_tracking** - Location history for velocity checks
- `tracking_id` - Auto-increment ID
- `did` - Decentralized identifier
- `latitude`, `longitude` - Current location
- `previous_latitude`, `previous_longitude` - Previous location
- `distance_km` - Distance traveled
- `time_delta_minutes` - Time between verifications
- `required_speed_kmh` - Required travel speed
- `impossible_travel` - Boolean flag

**hardware_attestation_log** - Device attestation history
- `attestation_id` - Auto-increment ID
- `device_fingerprint` - Unique device identifier
- `has_secure_enclave` - Secure hardware present
- `is_emulator`, `is_virtual_machine` - Bot detection flags
- `is_rooted`, `is_jailbroken` - Compromised device flags
- `trust_level` - Trust level (high, medium, low, untrusted)

**liveness_scoring_log** - AI liveness analysis history
- `liveness_id` - Auto-increment ID
- `overall_confidence` - Overall liveness confidence score
- `blood_flow_detected` - Blood flow detection result
- `deepfake_risk` - Risk level (none, low, medium, high, critical)
- Individual metric scores (human_texture, skin_texture, etc.)

**liveness_challenges** - Challenge tracking
- `challenge_id` - Unique challenge identifier
- `challenge_type` - Type of challenge
- `instructions` - Challenge instructions
- `status` - Status (pending, completed, failed, expired)
- `expires_at` - Challenge expiration time

---

## 📈 Monitoring and Metrics

### Key Metrics to Track

1. **Fraud Detection Rate**
   - Total fraud checks performed
   - Percentage passed/rejected/step-up required
   - Fraud flags by type

2. **Velocity Check Metrics**
   - Impossible travel detections per day
   - Average distance between verifications
   - Voice biometric step-up completion rate

3. **Hardware Attestation Metrics**
   - Emulator detection rate
   - Rooted/jailbroken device detection rate
   - Trust level distribution

4. **AI Liveness Metrics**
   - Average confidence score
   - Deepfake detection rate
   - Challenge completion rate
   - Challenge success rate

5. **Performance Metrics**
   - Average fraud check processing time
   - P95/P99 latency
   - Error rate

---

## 🚀 Production Deployment

### Environment Variables

```bash
# Fraud Detection Configuration
FRAUD_VELOCITY_MAX_SPEED_KMH=990
FRAUD_LIVENESS_THRESHOLD=0.999
FRAUD_ENABLE_VELOCITY_CHECK=true
FRAUD_ENABLE_HARDWARE_ATTESTATION=true
FRAUD_ENABLE_AI_LIVENESS=true

# Database
FRAUD_DB_HOST=localhost
FRAUD_DB_PORT=5432
FRAUD_DB_NAME=sovrn_fraud
FRAUD_DB_USER=sovrn
FRAUD_DB_PASSWORD=secret

# Logging
FRAUD_LOG_LEVEL=info
FRAUD_LOG_FORMAT=json
```

### Scaling Considerations

1. **Database Optimization**
   - Index on `did`, `verification_id`, `timestamp`
   - Partition `fraud_events` table by date
   - Regular vacuum and analyze

2. **Caching**
   - Cache recent velocity tracking data in Redis
   - Cache trusted device fingerprints
   - TTL: 24 hours

3. **Rate Limiting**
   - Limit fraud checks per DID: 100/hour
   - Limit challenge attempts: 3 per verification

4. **Horizontal Scaling**
   - Stateless fraud orchestrator (can scale horizontally)
   - Load balance across multiple instances
   - Shared PostgreSQL database

---

## ✅ Summary

The **Fraud Orchestrator** provides comprehensive fraud protection for the SOVRN Protocol:

✅ **Velocity Check** - Detects impossible travel (max 990 km/h)
✅ **Hardware Attestation** - Rejects emulators, VMs, rooted devices
✅ **AI Liveness Scoring** - Detects deepfakes (99.9% threshold)
✅ **Manual Step-Up** - Voice biometric for suspicious activity
✅ **Random Challenges** - Dynamic liveness tests
✅ **Real-Time Detection** - Sub-second fraud analysis
✅ **Complete API** - 5 REST endpoints
✅ **Database Logging** - Full audit trail

**🔐 Protect Identity. 🛡️ Prevent Fraud. 🚀 Build Trust.**

