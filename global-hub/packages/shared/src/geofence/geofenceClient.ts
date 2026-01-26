/**
 * SOVRA_Presence_Engine - Geofence Client
 * 
 * Client-side geofencing service for mobile apps
 * Handles location detection and step-up authentication
 */

import type {
  CheckZoneRequest,
  CheckZoneResponse,
  VerifyWithGeofenceRequest,
  VerifyWithGeofenceResponse,
  LocationData,
  LocationPermissionStatus,
  MovementChallenge,
  PFFLevel,
} from './types';

/**
 * GeofenceClient handles geofencing operations from mobile devices
 */
export class GeofenceClient {
  private hubEndpoint: string;
  private authToken: string;

  constructor(hubEndpoint: string, authToken: string) {
    this.hubEndpoint = hubEndpoint;
    this.authToken = authToken;
  }

  /**
   * SOVRA_Presence_Engine: Check if current location is in a security zone
   */
  async checkSecurityZone(location: LocationData): Promise<CheckZoneResponse> {
    console.log('[SOVRA_Presence_Engine] Checking security zone...', {
      latitude: location.latitude,
      longitude: location.longitude,
    });

    const request: CheckZoneRequest = {
      latitude: location.latitude,
      longitude: location.longitude,
    };

    const response = await fetch(`${this.hubEndpoint}/api/v1/geofence/check-zone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        'SOVRA-Client-Type': 'mobile',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Geofence check failed: ${response.statusText}`);
    }

    const result: CheckZoneResponse = await response.json();

    if (result.inSecurityZone) {
      console.log('[SOVRA_Presence_Engine] Security zone detected:', result.securityZone?.name);
      console.log('[SOVRA_Presence_Engine] Required PFF Level:', result.requiredPFFLevel);
    } else {
      console.log('[SOVRA_Presence_Engine] No security zone detected');
    }

    return result;
  }

  /**
   * SOVRA_Presence_Engine: Verify with geofencing
   * 
   * Performs PFF verification with automatic step-up authentication
   * based on location
   */
  async verifyWithGeofence(
    request: VerifyWithGeofenceRequest
  ): Promise<VerifyWithGeofenceResponse> {
    console.log('[SOVRA_Presence_Engine] Starting geofenced verification...', {
      did: request.did,
      location: `${request.latitude}, ${request.longitude}`,
    });

    const response = await fetch(`${this.hubEndpoint}/api/v1/geofence/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        'SOVRA-Client-Type': 'mobile',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Geofenced verification failed: ${response.statusText}`);
    }

    const result: VerifyWithGeofenceResponse = await response.json();

    // Log security events
    if (result.inSecurityZone) {
      console.log('[SOVRA_Presence_Engine] Verification in security zone:', result.securityZone);
    }

    if (result.challenge) {
      console.log('[SOVRA_Presence_Engine] Movement challenge required:', result.challenge.instructions);
    }

    if (result.onWatchlist) {
      console.warn('[SOVRA_Presence_Engine] DID is on watchlist');
    }

    if (result.alertTriggered) {
      console.warn('[SOVRA_Presence_Engine] Security alert triggered');
    }

    return result;
  }

  /**
   * SOVRA_Presence_Engine: Get current device location
   * 
   * Uses native geolocation APIs
   */
  async getCurrentLocation(): Promise<LocationData> {
    console.log('[SOVRA_Presence_Engine] Getting current location...');

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
            timestamp: position.timestamp,
          };

          console.log('[SOVRA_Presence_Engine] Location obtained:', {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: `${location.accuracy}m`,
          });

          resolve(location);
        },
        (error) => {
          console.error('[SOVRA_Presence_Engine] Location error:', error.message);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * SOVRA_Presence_Engine: Check location permissions
   */
  async checkLocationPermission(): Promise<LocationPermissionStatus> {
    console.log('[SOVRA_Presence_Engine] Checking location permissions...');

    // This is a simplified version - in React Native, use react-native-permissions
    if (!navigator.permissions) {
      return {
        granted: false,
        denied: false,
        restricted: true,
        message: 'Permissions API not available',
      };
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

      return {
        granted: result.state === 'granted',
        denied: result.state === 'denied',
        restricted: result.state === 'prompt',
        message: `Location permission: ${result.state}`,
      };
    } catch (error) {
      return {
        granted: false,
        denied: false,
        restricted: true,
        message: 'Failed to check permissions',
      };
    }
  }
}

export default GeofenceClient;

