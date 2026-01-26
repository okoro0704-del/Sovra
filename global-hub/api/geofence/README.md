# SOVRA Geofenced Security Protocol

## Overview

The Geofenced Security Protocol implements location-aware security for the SOVRA Hub. It automatically adjusts PFF verification requirements based on geographic risk zones and triggers instant encrypted alerts when watchlist DIDs scan in sensitive areas.

## Features

✅ **Zone Logic** - GPS coordinate checking against predefined security zones  
✅ **Step-Up Authentication** - Level 3 PFF (3D depth + random movement) for high-risk zones  
✅ **Watchlist Monitoring** - Real-time encrypted alerts to security forces  
✅ **Nigerian LGA Coverage** - Predefined zones for Borno, Yobe, Adamawa, Kaduna, Zamfara  
✅ **Privacy-First** - Encrypted alerts, no raw biometric data  
✅ **Sub-Second Performance** - Real-time geofencing with minimal latency  

## Architecture

```
GeofenceOrchestrator
├── GeofenceService (Zone Logic)
│   ├── CheckSecurityZone()
│   ├── GetRequiredPFFLevel()
│   └── IsWatchlistMonitoringRequired()
│
├── StepUpAuthService (Enhanced PFF)
│   ├── CheckStepUpRequirement()
│   ├── GenerateMovementChallenge()
│   └── ValidateMovementResponse()
│
└── WatchlistService (Security Alerts)
    ├── IsOnWatchlist()
    ├── CheckAndAlert()
    └── EncryptAlert()
```

## Files

### Core Logic
- `security_zones.go` - Zone detection and GPS checking
- `nigeria_zones.go` - Nigerian LGA configurations
- `stepup_auth.go` - Level 3 PFF requirements
- `watchlist.go` - Watchlist monitoring and alerts
- `geofence_orchestrator.go` - Main coordinator

### API
- `geofence_handlers.go` - HTTP endpoints
- `schema.sql` - Database schema

## API Endpoints

### 1. Check Security Zone

```bash
POST /api/v1/geofence/check-zone
Content-Type: application/json

{
  "latitude": 11.8500,
  "longitude": 13.1500
}
```

**Response**:
```json
{
  "in_security_zone": true,
  "security_zone": {
    "id": "NG-BO-001",
    "name": "Maiduguri Metropolitan",
    "risk_level": "critical",
    "required_pff_level": 3
  },
  "required_pff_level": 3,
  "message": "Security zone detected: Maiduguri Metropolitan..."
}
```

### 2. Verify with Geofence

```bash
POST /api/v1/geofence/verify
Content-Type: application/json

{
  "verification_id": "verify_abc123",
  "did": "did:sovra:nigeria:citizen_001",
  "latitude": 11.8500,
  "longitude": 13.1500,
  "location_name": "Maiduguri",
  "biometric_hash": "hash...",
  "liveness_data": "base64...",
  "video_frames": "base64...",
  "depth_data": "base64..."
}
```

**Response**:
```json
{
  "success": true,
  "in_security_zone": true,
  "security_zone": "Maiduguri Metropolitan...",
  "required_pff_level": 3,
  "challenge": {
    "challenge_id": "challenge_123",
    "instructions": ["Turn head left", "Blink twice"],
    "expected_duration": 12
  },
  "on_watchlist": false,
  "alert_triggered": false,
  "message": "Verification successful",
  "processing_time_ms": 245
}
```

## Usage Example

```go
package main

import (
    "context"
    "fmt"
    "github.com/sovra/hub/api/geofence"
)

func main() {
    // Initialize orchestrator
    encryptionKey := []byte("32-byte-aes-256-key-here-12345678")
    orchestrator := geofence.NewGeofenceOrchestrator(encryptionKey)
    
    // Create verification request
    req := &geofence.VerificationRequest{
        VerificationID: "verify_123",
        DID:            "did:sovra:nigeria:citizen_001",
        Latitude:       11.8500,
        Longitude:      13.1500,
        LocationName:   "Maiduguri",
        BiometricHash:  "hash...",
    }
    
    // Perform geofence check
    result, err := orchestrator.PerformGeofenceCheck(context.Background(), req)
    if err != nil {
        panic(err)
    }
    
    // Check results
    if result.InSecurityZone {
        fmt.Printf("Security Zone: %s\n", result.SecurityZone.GetZoneInfo())
        fmt.Printf("Required PFF Level: %d\n", result.PFFLevel)
    }
    
    if result.OnWatchlist {
        fmt.Println("⚠️ DID is on watchlist")
    }
    
    if result.AlertTriggered {
        fmt.Printf("🚨 Security alert triggered: %s\n", result.AlertID)
    }
}
```

## Security Zones

### Critical Risk (PFF Level 3)

**Borno State**:
- Maiduguri Metropolitan (11.75°N - 11.90°N, 13.05°E - 13.20°E)
- Gwoza LGA (10.95°N - 11.10°N, 13.65°E - 13.80°E)

**Yobe State**:
- Damaturu LGA (11.70°N - 11.80°N, 11.90°E - 12.05°E)

**Adamawa State**:
- Madagali LGA (10.80°N - 10.95°N, 13.40°E - 13.60°E)

### High Risk (PFF Level 3)

**Kaduna State**:
- Birnin Gwari LGA (10.90°N - 11.10°N, 6.60°E - 6.80°E)

**Zamfara State**:
- Anka LGA (12.00°N - 12.20°N, 5.90°E - 6.10°E)

## Database Setup

```bash
# Run schema
psql -U postgres -d sovra_hub -f schema.sql
```

## Testing

```bash
# Test zone detection
curl -X POST http://localhost:8080/api/v1/geofence/check-zone \
  -H "Content-Type: application/json" \
  -d '{"latitude": 11.8500, "longitude": 13.1500}'

# Test verification
curl -X POST http://localhost:8080/api/v1/geofence/verify \
  -H "Content-Type: application/json" \
  -d '{
    "verification_id": "verify_123",
    "did": "did:sovra:nigeria:citizen_001",
    "latitude": 11.8500,
    "longitude": 13.1500,
    "location_name": "Maiduguri",
    "biometric_hash": "hash123",
    "liveness_data": "data123"
  }'
```

## Documentation

See `global-hub/docs/GEOFENCED_SECURITY_PROTOCOL.md` for complete documentation.

## License

Proprietary - SOVRA Protocol

