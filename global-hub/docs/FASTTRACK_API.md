# SOVRN Protocol - Fast-Track API

## Overview

The **Fast-Track API** is a high-priority verification system designed for time-sensitive use cases like Airport Security, Border Control, Hospital Emergency Access, and other critical scenarios where sub-500ms response times are required.

## Key Features

- **⚡ Sub-500ms Response Time**: Optimized for high-priority clients
- **🎯 Trust Score (0-100)**: Real-time risk assessment
- **💾 Temporal Cache**: 24-hour verification persistence
- **🔄 Zero Repeat-Latency**: Cached users bypass full verification
- **🔐 Liveness Detection**: Anti-spoofing biometric checks
- **🌐 Hub-Spoke Handshake**: Asynchronous global synchronization

## Architecture

```
┌─────────────────┐
│ High-Priority   │
│ Client          │
│ (Airport)       │
└────────┬────────┘
         │
         │ POST /v1/fasttrack/verify
         │ Target: <500ms
         ▼
┌─────────────────────────────────┐
│ Nigerian Spoke API              │
│                                 │
│  1. Check Temporal Cache        │
│     ├─ Cache Hit → Return (5ms) │
│     └─ Cache Miss → Continue    │
│                                 │
│  2. Database Lookup (50ms)      │
│  3. Trust Score Calc (20ms)     │
│  4. Liveness Check (30ms)       │
│  5. Cache Result (10ms)         │
│                                 │
│  Total: ~115ms (live)           │
└─────────────────────────────────┘
         │
         │ Async Handshake
         ▼
┌─────────────────────────────────┐
│ Global Hub                      │
│ - Cross-spoke sync              │
│ - Global trust updates          │
│ - Analytics                     │
└─────────────────────────────────┘
```

## API Endpoints

### 1. Fast-Track Verification

**Endpoint**: `POST /v1/fasttrack/verify`

**Description**: Perform high-priority PFF verification with trust score calculation.

**Headers**:
```
X-API-KEY: your-api-key
Content-Type: application/json
```

**Request Body**:
```json
{
  "pff_hash": "hashed_fingerprint_data",
  "requester_id": "airport_security_001",
  "context": "airport_security",
  "liveness_data": "{\"motion_detected\":true,\"depth_sensor\":true,\"temperature_check\":true}",
  "priority_level": "critical"
}
```

**Response** (Success - Cached):
```json
{
  "success": true,
  "trust_score": 92,
  "trust_level": "very_high",
  "verification_id": "550e8400-e29b-41d4-a716-446655440000",
  "citizen_id": "123e4567-e89b-12d3-a456-426614174000",
  "cached": true,
  "cache_expires_at": "2026-01-27T14:30:00Z",
  "liveness_check": "passed",
  "response_time_ms": 5,
  "message": "Verified from temporal cache (zero-latency)"
}
```

**Response** (Success - Live):
```json
{
  "success": true,
  "trust_score": 85,
  "trust_level": "very_high",
  "verification_id": "550e8400-e29b-41d4-a716-446655440001",
  "citizen_id": "123e4567-e89b-12d3-a456-426614174000",
  "cached": false,
  "cache_expires_at": "2026-01-27T14:30:00Z",
  "liveness_check": "passed",
  "response_time_ms": 115,
  "message": "Live verification completed and cached"
}
```

**Response** (Failure):
```json
{
  "success": false,
  "trust_score": 0,
  "trust_level": "very_low",
  "verification_id": "550e8400-e29b-41d4-a716-446655440002",
  "cached": false,
  "response_time_ms": 45,
  "message": "Citizen not found in registry"
}
```

### 2. Fast-Track Status

**Endpoint**: `GET /v1/fasttrack/status/:citizenId?requester_id=xxx`

**Description**: Check if a citizen has a valid cached verification.

**Response**:
```json
{
  "success": true,
  "cached": true,
  "trust_score": 92,
  "trust_level": "very_high",
  "cache_expires_at": "2026-01-27T14:30:00Z",
  "verification_count": 3,
  "last_verified_at": "2026-01-26T14:30:00Z",
  "message": "Citizen has valid cached verification"
}
```

### 3. Cache Invalidation

**Endpoint**: `POST /v1/fasttrack/invalidate`

**Description**: Invalidate cached verification (security concerns, status changes).

**Request Body**:
```json
{
  "citizen_id": "123e4567-e89b-12d3-a456-426614174000",
  "reason": "Citizen status changed to suspended"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Cache invalidated successfully"
}
```

## Trust Score Calculation

The trust score is calculated on a **0-100 scale** based on four factors:

### 1. Verification History (0-30 points)
- 50+ verifications: 30 points
- 20-49 verifications: 25 points
- 10-19 verifications: 20 points
- 5-9 verifications: 15 points
- 1-4 verifications: 10 points
- 0 verifications: 0 points

### 2. Recency (0-20 points)
- Last verified < 1 hour ago: 20 points
- Last verified < 6 hours ago: 15 points
- Last verified < 24 hours ago: 10 points
- Last verified < 1 week ago: 5 points
- Never verified: 0 points

### 3. Liveness Check (0-25 points)
- Passed: 25 points
- Suspicious: 10 points
- Failed: 0 points
- Not performed: 15 points (neutral)

### 4. Risk Indicators (0-25 points)
- Start with 25 points
- Deduct 5 points per risk flag
- Deduct 3 points per suspicious activity
- Minimum: 0 points

### Trust Levels

| Score Range | Trust Level | Recommended Action |
|-------------|-------------|-------------------|
| 85-100      | Very High   | ✅ Approve immediately |
| 70-84       | High        | ✅ Approve with standard checks |
| 50-69       | Medium      | ⚠️ Approve with additional verification |
| 30-49       | Low         | ⚠️ Manual review required |
| 0-29        | Very Low    | ❌ Deny or escalate |

## Temporal Cache System

### Overview

The Temporal Cache stores verified user data for **24 hours** after their first successful verification. This enables **zero-latency** repeat verifications for scenarios like:

- **Airport**: Check-in → Security → Boarding (3 verifications, only 1 live)
- **Hospital**: Emergency admission → Multiple department access
- **Border Control**: Entry → Customs → Immigration

### Cache Structure

```typescript
{
  citizen_id: "123e4567-e89b-12d3-a456-426614174000",
  pff_hash: "hashed_fingerprint",
  trust_score: 92,
  trust_level: "very_high",
  verification_id: "550e8400-e29b-41d4-a716-446655440000",
  verified_at: "2026-01-26T14:30:00Z",
  expires_at: "2026-01-27T14:30:00Z",
  verification_count: 3,
  contexts: ["airport_security", "boarding_gate", "customs"]
}
```

### Cache Key Format

```
fasttrack:verified:{citizen_id}
```

### Cache Behavior

1. **First Verification** (Cache Miss):
   - Perform full verification (~115ms)
   - Calculate trust score
   - Store in cache with 24-hour TTL
   - Return result

2. **Subsequent Verifications** (Cache Hit):
   - Retrieve from cache (~5ms)
   - Increment verification count
   - Add context to list
   - Return cached result

3. **Cache Expiration**:
   - Automatic after 24 hours
   - Manual invalidation on status change
   - Manual invalidation on security concerns

### Redis Configuration

**Development**:
```bash
REDIS_URL=redis://localhost:6379
```

**Production**:
```bash
REDIS_URL=redis://your-redis-host:6379
REDIS_PASSWORD=your-secure-password
REDIS_TLS_ENABLED=true
```

## Liveness Detection

### Purpose

Prevent spoofing attacks using:
- Photos or videos of the person
- 3D-printed masks
- Deepfake technology

### Detection Methods

1. **Motion Detection**: Requires live movement
2. **Depth Sensor**: Detects 3D facial structure
3. **Temperature Check**: Verifies body heat
4. **Blink Detection**: Requires natural eye movement
5. **Challenge-Response**: Random facial gestures

### Liveness Data Format

```json
{
  "motion_detected": true,
  "depth_sensor": true,
  "temperature_check": true,
  "blink_count": 3,
  "challenge_response": "smile_detected"
}
```

### Liveness Status

- **Passed**: All checks successful
- **Suspicious**: Some checks failed (manual review)
- **Failed**: Critical checks failed (deny access)

## Hub-Spoke Handshake

### Asynchronous Communication

The Fast-Track API uses asynchronous messaging between the Global Hub and National Spokes for:

1. **Verification Requests**: Hub → Spoke
2. **Verification Responses**: Spoke → Hub
3. **Cache Synchronization**: Bidirectional
4. **Trust Updates**: Hub → All Spokes

### Message Types

#### 1. Verification Request
```json
{
  "message_id": "msg_123",
  "spoke_id": "nigeria",
  "message_type": "verification_request",
  "payload": {
    "citizen_id": "123e4567-e89b-12d3-a456-426614174000",
    "pff_hash": "hashed_fingerprint",
    "requester_id": "airport_security_001",
    "context": "airport_security"
  },
  "timestamp": "2026-01-26T14:30:00Z",
  "priority": "critical"
}
```

#### 2. Verification Response
```json
{
  "message_id": "msg_124",
  "spoke_id": "nigeria",
  "message_type": "verification_response",
  "payload": {
    "request_message_id": "msg_123",
    "success": true,
    "trust_score": 92,
    "trust_level": "very_high",
    "verification_id": "550e8400-e29b-41d4-a716-446655440000",
    "cached": false,
    "response_time_ms": 115
  },
  "timestamp": "2026-01-26T14:30:00.115Z",
  "priority": "high"
}
```

#### 3. Cache Sync
```json
{
  "message_id": "msg_125",
  "spoke_id": "nigeria",
  "message_type": "cache_sync",
  "payload": {
    "citizen_id": "123e4567-e89b-12d3-a456-426614174000",
    "trust_score": 92,
    "trust_level": "very_high",
    "expires_at": "2026-01-27T14:30:00Z",
    "action": "create"
  },
  "timestamp": "2026-01-26T14:30:00Z",
  "priority": "normal"
}
```

#### 4. Trust Update
```json
{
  "message_id": "msg_126",
  "spoke_id": "nigeria",
  "message_type": "trust_update",
  "payload": {
    "citizen_id": "123e4567-e89b-12d3-a456-426614174000",
    "new_trust_score": 45,
    "new_trust_level": "low",
    "reason": "Multiple failed verification attempts detected"
  },
  "timestamp": "2026-01-26T14:35:00Z",
  "priority": "high"
}
```

## Use Cases

### 1. Airport Security

**Scenario**: Passenger travels from Lagos to London

**Flow**:
1. **Check-in** (Live verification: 115ms)
   - Trust Score: 92 (Very High)
   - Cached for 24 hours

2. **Security Checkpoint** (Cached: 5ms)
   - Trust Score: 92 (from cache)
   - Zero repeat-latency

3. **Boarding Gate** (Cached: 5ms)
   - Trust Score: 92 (from cache)
   - Zero repeat-latency

**Total Time**: 125ms (vs 345ms without caching)

### 2. Hospital Emergency

**Scenario**: Patient admitted to emergency room

**Flow**:
1. **Emergency Admission** (Live: 115ms)
   - Trust Score: 88 (Very High)
   - Immediate access granted

2. **Radiology Department** (Cached: 5ms)
   - Trust Score: 88 (from cache)

3. **Pharmacy** (Cached: 5ms)
   - Trust Score: 88 (from cache)

### 3. Border Control

**Scenario**: Traveler crossing international border

**Flow**:
1. **Entry Point** (Live: 115ms)
   - Trust Score: 75 (High)
   - Liveness check: Passed

2. **Customs** (Cached: 5ms)
   - Trust Score: 75 (from cache)

3. **Immigration** (Cached: 5ms)
   - Trust Score: 75 (from cache)

## Performance Optimization

### Target: <500ms Response Time

**Breakdown**:
- Cache lookup: 5ms
- Database query: 50ms
- Trust score calculation: 20ms
- Liveness check: 30ms
- Cache write: 10ms
- **Total**: ~115ms (live verification)

### Optimization Strategies

1. **Database Indexing**:
   - Index on `pff_hash` for fast citizen lookup
   - Index on `citizen_id` for verification history

2. **Redis Caching**:
   - In-memory cache for sub-10ms lookups
   - 24-hour TTL reduces database load

3. **Async Processing**:
   - Hub-spoke handshake doesn't block response
   - Analytics and logging happen asynchronously

4. **Connection Pooling**:
   - Reuse database connections
   - Reuse Redis connections

## Security Considerations

### 1. Cache Invalidation

Immediately invalidate cache when:
- Citizen status changes (suspended/revoked)
- Security concerns arise
- Manual admin action
- Suspicious activity detected

### 2. Liveness Detection

Always perform liveness checks for:
- First-time verifications
- High-risk contexts
- After cache expiration

### 3. Rate Limiting

Prevent abuse:
- Max 10 verifications per citizen per day
- Max 100 verifications per requester per hour
- Exponential backoff on failures

### 4. Audit Trail

Log all fast-track verifications:
- Timestamp
- Requester ID
- Context
- Trust score
- Cached vs live
- Response time

## Integration Guide

### 1. Install Dependencies

```bash
npm install redis uuid
```

### 2. Configure Environment

```bash
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Initialize Services

```typescript
import { initializeRedis } from './services/temporalCache';

await initializeRedis();
```

### 4. Make API Calls

```typescript
const response = await fetch('https://api.sovrn.network/v1/fasttrack/verify', {
  method: 'POST',
  headers: {
    'X-API-KEY': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pff_hash: 'hashed_fingerprint',
    requester_id: 'airport_security_001',
    context: 'airport_security',
    liveness_data: JSON.stringify({
      motion_detected: true,
      depth_sensor: true,
      temperature_check: true
    }),
    priority_level: 'critical'
  })
});

const result = await response.json();
console.log(`Trust Score: ${result.trust_score}`);
console.log(`Response Time: ${result.response_time_ms}ms`);
```

## Monitoring and Analytics

### Key Metrics

1. **Response Time**:
   - P50, P95, P99 latencies
   - Cache hit rate
   - Database query time

2. **Trust Scores**:
   - Average trust score
   - Distribution by level
   - Trends over time

3. **Cache Performance**:
   - Hit rate (target: >80%)
   - Miss rate
   - Eviction rate

4. **Verification Volume**:
   - Verifications per hour
   - By context (airport, hospital, etc.)
   - By requester

### Alerts

Set up alerts for:
- Response time > 500ms
- Cache hit rate < 70%
- Trust score anomalies
- High failure rates

## Future Enhancements

1. **Machine Learning**:
   - Adaptive trust scoring
   - Anomaly detection
   - Predictive risk assessment

2. **Cross-Spoke Verification**:
   - Verify Nigerian citizen in Kenya
   - Global trust score synchronization

3. **Biometric Fusion**:
   - Combine fingerprint + face + iris
   - Multi-factor biometric verification

4. **Blockchain Integration**:
   - Immutable verification audit trail
   - Decentralized trust scoring

## Support

For questions or issues:
- **Email**: fasttrack@sovrn.network
- **GitHub**: https://github.com/sovrn-protocol/sovrn
- **Telegram**: @sovrn_fasttrack


