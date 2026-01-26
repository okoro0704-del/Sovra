/**
 * SOVRA_Presence_Engine - Geofenced Security Protocol Types
 * 
 * Client-side types for geofencing and step-up authentication
 */

// ============================================================================
// SECURITY ZONES
// ============================================================================

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface SecurityZone {
  id: string;
  name: string;
  country: string;
  region: string;
  lga?: string; // Local Government Area
  boundaries: GeoPoint[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiredPFFLevel: 1 | 2 | 3;
  watchlistMonitoring: boolean;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PFF LEVELS
// ============================================================================

export enum PFFLevel {
  Basic = 1,    // Standard liveness check
  Enhanced = 2, // Enhanced liveness + texture analysis
  Maximum = 3,  // 3D depth + random movement challenge
}

export interface PFFRequirement {
  level: PFFLevel;
  require3DDepth: boolean;
  requireMovement: boolean;
  challenge?: MovementChallenge;
}

// ============================================================================
// MOVEMENT CHALLENGES
// ============================================================================

export interface MovementChallenge {
  challengeID: string;
  instructions: string[];
  expectedDuration: number; // seconds
  createdAt: string;
  expiresAt: string;
}

export interface MovementChallengeResponse {
  challengeID: string;
  videoFrames: string; // Base64 encoded video
  depthData: string;   // Base64 encoded 3D depth data
  completedAt: string;
}

// ============================================================================
// GEOFENCE API REQUESTS/RESPONSES
// ============================================================================

export interface CheckZoneRequest {
  latitude: number;
  longitude: number;
}

export interface CheckZoneResponse {
  inSecurityZone: boolean;
  securityZone?: SecurityZone;
  requiredPFFLevel: number;
  message: string;
}

export interface VerifyWithGeofenceRequest {
  verificationID: string;
  did: string;
  latitude: number;
  longitude: number;
  locationName: string;
  biometricHash: string;
  livenessData: string; // Base64 encoded
  videoFrames?: string; // Base64 encoded (required for Level 3)
  depthData?: string;   // Base64 encoded (required for Level 3)
}

export interface VerifyWithGeofenceResponse {
  success: boolean;
  inSecurityZone: boolean;
  securityZone?: string;
  requiredPFFLevel: number;
  challenge?: MovementChallenge;
  onWatchlist: boolean;
  alertTriggered: boolean;
  message: string;
  processingTimeMs: number;
}

// ============================================================================
// WATCHLIST
// ============================================================================

export interface WatchlistEntry {
  did: string;
  reason: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  addedBy: string;
  addedAt: string;
  expiresAt?: string;
  metadata?: Record<string, string>;
}

export interface SecurityAlert {
  alertID: string;
  alertType: 'watchlist_scan' | 'impossible_travel' | 'fraud_detected';
  timestamp: string;
  did: string;
  threatLevel: string;
  latitude: number;
  longitude: number;
  locationName: string;
  securityZone: string;
  reason: string;
  verificationID: string;
  encryptedPayload: string;
  iv: string;
}

// ============================================================================
// GEOFENCE CHECK RESULT
// ============================================================================

export interface GeofenceCheckResult {
  inSecurityZone: boolean;
  securityZone?: SecurityZone;
  requiresStepUp: boolean;
  pffLevel: PFFLevel;
  challenge?: MovementChallenge;
  require3DDepth: boolean;
  requireMovement: boolean;
  onWatchlist: boolean;
  watchlistEntry?: WatchlistEntry;
  alertTriggered: boolean;
  alertID?: string;
  passed: boolean;
  reason: string;
  processingTimeMs: number;
}

// ============================================================================
// LOCATION SERVICES
// ============================================================================

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  denied: boolean;
  restricted: boolean;
  message: string;
}

