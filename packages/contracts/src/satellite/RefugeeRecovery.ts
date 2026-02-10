/**
 * RefugeeRecovery.ts - Border-Cross Feature for War Refugees
 * 
 * "When borders close, the satellite opens. When nations fall, the heartbeat remains."
 * 
 * Features:
 * - Geofencing to detect when user is outside home country
 * - Satellite connection for refugees (bypassing ground infrastructure)
 * - Temporary Vitalized Status for emergency vault access
 * - Emergency 10 VIDA wealth access in any country
 * - Identity preservation during conflict
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 */

import { syncToOrbitalMesh, TruthBundle, SatelliteNode, SATELLITE_MESH } from './SSS_Sync';

// ============ TYPES ============

export interface GeofenceRegion {
  country: string;
  countryCode: string;
  boundaries: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface RefugeeStatus {
  uid: string;
  homeCountry: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    country: string;
    timestamp: number;
  };
  isOutsideHomeGeofence: boolean;
  temporaryVitalizedStatus: boolean;
  emergencyVaultAccess: {
    liquid_vida: number;
    accessible: boolean;
    expiresAt: number;
  };
  satelliteConnected: boolean;
  connectedSatellite: string | null;
  borderCrossTimestamp: number | null;
}

export interface BorderCrossAlert {
  uid: string;
  fromCountry: string;
  toCountry: string;
  timestamp: number;
  reason: 'WAR_ZONE' | 'CONFLICT' | 'EMERGENCY' | 'VOLUNTARY';
  emergencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ============ CONSTANTS ============

const TEMPORARY_STATUS_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const EMERGENCY_VIDA_AMOUNT = 10; // 10 VIDA emergency access

// ============ GEOFENCE DATA ============

/**
 * Simplified geofence boundaries for West African countries
 * In production, use precise GeoJSON polygons
 */
export const GEOFENCE_REGIONS: GeofenceRegion[] = [
  {
    country: 'Nigeria',
    countryCode: 'NG',
    boundaries: {
      north: 13.9,
      south: 4.3,
      east: 14.7,
      west: 2.7,
    },
  },
  {
    country: 'Ghana',
    countryCode: 'GH',
    boundaries: {
      north: 11.2,
      south: 4.7,
      east: 1.2,
      west: -3.3,
    },
  },
  {
    country: 'Cameroon',
    countryCode: 'CM',
    boundaries: {
      north: 13.1,
      south: 1.7,
      east: 16.2,
      west: 8.5,
    },
  },
  {
    country: 'Benin',
    countryCode: 'BJ',
    boundaries: {
      north: 12.4,
      south: 6.2,
      east: 3.9,
      west: 0.8,
    },
  },
];

// ============ MAIN FUNCTIONS ============

/**
 * Check if user is outside their home country (Border-Cross detection)
 */
export async function checkBorderCrossStatus(
  uid: string,
  homeCountry: string,
  currentLocation: { latitude: number; longitude: number }
): Promise<RefugeeStatus> {
  console.log(`[REFUGEE] Checking border-cross status for UID: ${uid}`);

  // 1. Determine current country from coordinates
  const currentCountry = getCountryFromCoordinates(currentLocation.latitude, currentLocation.longitude);

  // 2. Check if outside home geofence
  const isOutsideHome = currentCountry !== homeCountry;

  console.log(`[REFUGEE] Home: ${homeCountry}, Current: ${currentCountry}, Outside: ${isOutsideHome}`);

  if (isOutsideHome) {
    // 3. Connect to satellite mesh
    const satelliteConnection = await connectToNearestSatellite(currentLocation);

    if (!satelliteConnection.success) {
      console.error('[REFUGEE] Failed to connect to satellite mesh');
      return createFailedRefugeeStatus(uid, homeCountry, currentLocation, currentCountry);
    }

    // 4. Retrieve Truth-Bundle from satellite
    const truthBundle = await retrieveTruthBundleFromSatellite(uid, satelliteConnection.satellite);

    if (!truthBundle) {
      console.error('[REFUGEE] Failed to retrieve Truth-Bundle from satellite');
      return createFailedRefugeeStatus(uid, homeCountry, currentLocation, currentCountry);
    }

    // 5. Grant Temporary Vitalized Status
    const temporaryStatus = await grantTemporaryVitalizedStatus(uid, truthBundle);

    // 6. Enable Emergency Vault Access
    const vaultAccess = await enableEmergencyVaultAccess(uid, truthBundle);

    // 7. Trigger Border-Cross Alert
    await triggerBorderCrossAlert({
      uid,
      fromCountry: homeCountry,
      toCountry: currentCountry,
      timestamp: Date.now(),
      reason: 'WAR_ZONE',
      emergencyLevel: 'HIGH',
    });

    console.log(`[REFUGEE] ✅ Temporary Vitalized Status granted for ${uid}`);
    console.log(`[REFUGEE] ✅ Emergency vault access enabled: ${vaultAccess.liquid_vida} VIDA`);

    return {
      uid,
      homeCountry,
      currentLocation: {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        country: currentCountry,
        timestamp: Date.now(),
      },
      isOutsideHomeGeofence: true,
      temporaryVitalizedStatus: true,
      emergencyVaultAccess: vaultAccess,
      satelliteConnected: true,
      connectedSatellite: satelliteConnection.satellite.id,
      borderCrossTimestamp: Date.now(),
    };
  }

  // User is still in home country
  return {
    uid,
    homeCountry,
    currentLocation: {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      country: currentCountry,
      timestamp: Date.now(),
    },
    isOutsideHomeGeofence: false,
    temporaryVitalizedStatus: false,
    emergencyVaultAccess: {
      liquid_vida: 0,
      accessible: false,
      expiresAt: 0,
    },
    satelliteConnected: false,
    connectedSatellite: null,
    borderCrossTimestamp: null,
  };
}

/**
 * Connect to nearest satellite based on current location
 */
async function connectToNearestSatellite(
  location: { latitude: number; longitude: number }
): Promise<{ success: boolean; satellite: SatelliteNode | null }> {
  console.log(`[REFUGEE] Connecting to nearest satellite...`);

  // Find nearest active satellite
  let nearestSatellite: SatelliteNode | null = null;
  let minDistance = Infinity;

  for (const satellite of SATELLITE_MESH) {
    if (satellite.status !== 'ACTIVE') {
      continue;
    }

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      satellite.latitude,
      satellite.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestSatellite = satellite;
    }
  }

  if (!nearestSatellite) {
    return { success: false, satellite: null };
  }

  console.log(`[REFUGEE] Connected to ${nearestSatellite.name} (${nearestSatellite.orbit})`);

  return { success: true, satellite: nearestSatellite };
}

/**
 * Retrieve Truth-Bundle from satellite (bypassing ground infrastructure)
 */
async function retrieveTruthBundleFromSatellite(
  uid: string,
  satellite: SatelliteNode
): Promise<TruthBundle | null> {
  console.log(`[REFUGEE] Retrieving Truth-Bundle from ${satellite.name}...`);

  // In production, query satellite API for Truth-Bundle
  // For now, simulate retrieval
  const mockBundle: TruthBundle = {
    uid,
    heartbeatHash: `HEARTBEAT_${uid}`,
    citizenshipData: `ENCRYPTED_CITIZENSHIP_${uid}`,
    vaultBalance: {
      liquid_vida: 5,
      locked_vida: 5,
      nvida: 1000,
    },
    lastSync: Date.now(),
    syncedSatellites: [satellite.id],
  };

  return mockBundle;
}

/**
 * Grant Temporary Vitalized Status (90 days)
 */
async function grantTemporaryVitalizedStatus(
  uid: string,
  truthBundle: TruthBundle
): Promise<boolean> {
  console.log(`[REFUGEE] Granting Temporary Vitalized Status for ${uid}...`);

  // In production, update blockchain state
  // Mark user as having temporary status with expiration

  return true;
}

/**
 * Enable Emergency Vault Access (10 VIDA)
 */
async function enableEmergencyVaultAccess(
  uid: string,
  truthBundle: TruthBundle
): Promise<{ liquid_vida: number; accessible: boolean; expiresAt: number }> {
  console.log(`[REFUGEE] Enabling emergency vault access for ${uid}...`);

  const expiresAt = Date.now() + TEMPORARY_STATUS_DURATION_MS;

  // In production, unlock vault on blockchain
  // Allow user to access their liquid VIDA balance

  return {
    liquid_vida: Math.min(truthBundle.vaultBalance.liquid_vida, EMERGENCY_VIDA_AMOUNT),
    accessible: true,
    expiresAt,
  };
}

/**
 * Trigger Border-Cross Alert (notify authorities, NGOs, etc.)
 */
async function triggerBorderCrossAlert(alert: BorderCrossAlert): Promise<void> {
  console.log(`[REFUGEE] 🚨 BORDER-CROSS ALERT: ${alert.uid} crossed from ${alert.fromCountry} to ${alert.toCountry}`);

  // In production, send alerts to:
  // - UNHCR (UN Refugee Agency)
  // - Local NGOs
  // - Embassy/Consulate
  // - Family members (if opted in)
}

// ============ HELPER FUNCTIONS ============

/**
 * Determine country from GPS coordinates
 */
function getCountryFromCoordinates(latitude: number, longitude: number): string {
  for (const region of GEOFENCE_REGIONS) {
    const { boundaries } = region;

    if (
      latitude >= boundaries.south &&
      latitude <= boundaries.north &&
      longitude >= boundaries.west &&
      longitude <= boundaries.east
    ) {
      return region.country;
    }
  }

  return 'UNKNOWN';
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function createFailedRefugeeStatus(
  uid: string,
  homeCountry: string,
  currentLocation: { latitude: number; longitude: number },
  currentCountry: string
): RefugeeStatus {
  return {
    uid,
    homeCountry,
    currentLocation: {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      country: currentCountry,
      timestamp: Date.now(),
    },
    isOutsideHomeGeofence: true,
    temporaryVitalizedStatus: false,
    emergencyVaultAccess: {
      liquid_vida: 0,
      accessible: false,
      expiresAt: 0,
    },
    satelliteConnected: false,
    connectedSatellite: null,
    borderCrossTimestamp: Date.now(),
  };
}

