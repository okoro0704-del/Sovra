/**
 * SOVRA_Presence_Engine - Geofence Integration Examples
 * 
 * Example usage patterns for geofenced security protocol
 */

import { GeofenceClient } from './geofenceClient';
import type {
  LocationData,
  VerifyWithGeofenceRequest,
  PFFLevel,
} from './types';

// ============================================================================
// Example 1: Basic Zone Check
// ============================================================================

export async function exampleBasicZoneCheck() {
  const client = new GeofenceClient('https://hub.sovra.io', 'auth_token_here');
  
  // Get current location
  const location = await client.getCurrentLocation();
  
  // Check if in security zone
  const zoneCheck = await client.checkSecurityZone(location);
  
  if (zoneCheck.inSecurityZone) {
    console.log('⚠️ You are in a security zone:', zoneCheck.securityZone?.name);
    console.log('Required PFF Level:', zoneCheck.requiredPFFLevel);
  } else {
    console.log('✅ Normal location - basic PFF sufficient');
  }
}

// ============================================================================
// Example 2: Verification with Automatic Step-Up
// ============================================================================

export async function exampleVerificationWithStepUp(
  did: string,
  biometricHash: string,
  livenessData: string
) {
  const client = new GeofenceClient('https://hub.sovra.io', 'auth_token_here');
  
  // 1. Get location
  const location = await client.getCurrentLocation();
  
  // 2. Check zone requirements
  const zoneCheck = await client.checkSecurityZone(location);
  
  // 3. Prepare verification request
  const request: VerifyWithGeofenceRequest = {
    verificationID: `verify_${Date.now()}`,
    did: did,
    latitude: location.latitude,
    longitude: location.longitude,
    locationName: 'Current Location',
    biometricHash: biometricHash,
    livenessData: livenessData,
  };
  
  // 4. If Level 3 PFF required, capture enhanced data
  if (zoneCheck.requiredPFFLevel === 3) {
    console.log('🔒 Level 3 PFF required - capturing enhanced biometric data...');
    
    // Show movement challenge to user
    if (zoneCheck.securityZone) {
      alert(`Security Zone: ${zoneCheck.securityZone.name}\nEnhanced verification required.`);
    }
    
    // In production, capture actual 3D depth and video
    // request.depthData = await capture3DDepth();
    // request.videoFrames = await captureMovementVideo();
    
    // Mock data for example
    request.depthData = 'base64_depth_data_here';
    request.videoFrames = 'base64_video_frames_here';
  }
  
  // 5. Perform verification
  const result = await client.verifyWithGeofence(request);
  
  if (result.success) {
    console.log('✅ Verification successful!');
  } else {
    console.error('❌ Verification failed:', result.message);
  }
  
  return result;
}

// ============================================================================
// Example 3: Handling Movement Challenge
// ============================================================================

export async function exampleMovementChallenge() {
  const client = new GeofenceClient('https://hub.sovra.io', 'auth_token_here');
  
  const location = await client.getCurrentLocation();
  const zoneCheck = await client.checkSecurityZone(location);
  
  if (zoneCheck.requiredPFFLevel === 3) {
    // Movement challenge will be included in response
    const request: VerifyWithGeofenceRequest = {
      verificationID: `verify_${Date.now()}`,
      did: 'did:sovra:nigeria:citizen_001',
      latitude: location.latitude,
      longitude: location.longitude,
      locationName: 'Maiduguri',
      biometricHash: 'hash_here',
      livenessData: 'liveness_data_here',
    };
    
    const result = await client.verifyWithGeofence(request);
    
    if (result.challenge) {
      console.log('🎯 Movement Challenge Required:');
      result.challenge.instructions.forEach((instruction, index) => {
        console.log(`  ${index + 1}. ${instruction}`);
      });
      
      console.log(`Expected duration: ${result.challenge.expectedDuration} seconds`);
      console.log(`Expires at: ${result.challenge.expiresAt}`);
      
      // In production:
      // 1. Show instructions to user
      // 2. Record video while user performs movements
      // 3. Submit video + depth data for validation
    }
  }
}

// ============================================================================
// Example 4: Location Permission Handling
// ============================================================================

export async function exampleLocationPermissions() {
  const client = new GeofenceClient('https://hub.sovra.io', 'auth_token_here');
  
  // Check permissions first
  const permissionStatus = await client.checkLocationPermission();
  
  if (!permissionStatus.granted) {
    console.log('📍 Location permission required');
    
    if (permissionStatus.denied) {
      alert('Location permission denied. Please enable in settings.');
      return;
    }
    
    if (permissionStatus.restricted) {
      alert('Please grant location permission to continue.');
      // In React Native, use Linking.openSettings()
      return;
    }
  }
  
  // Permission granted - proceed with location check
  const location = await client.getCurrentLocation();
  console.log('✅ Location obtained:', location);
}

// ============================================================================
// Example 5: React Native Component Integration
// ============================================================================

export const ExampleReactNativeComponent = `
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { GeofenceClient } from '@sovra/shared/geofence/geofenceClient';

export const GeofencedVerification: React.FC = () => {
  const [inSecurityZone, setInSecurityZone] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [pffLevel, setPFFLevel] = useState(1);
  
  const client = new GeofenceClient('https://hub.sovra.io', 'auth_token');
  
  useEffect(() => {
    checkLocation();
  }, []);
  
  const checkLocation = async () => {
    try {
      const location = await client.getCurrentLocation();
      const zoneCheck = await client.checkSecurityZone(location);
      
      setInSecurityZone(zoneCheck.inSecurityZone);
      setZoneName(zoneCheck.securityZone?.name || '');
      setPFFLevel(zoneCheck.requiredPFFLevel);
      
      if (zoneCheck.inSecurityZone) {
        Alert.alert(
          'Security Zone Detected',
          \`You are in: \${zoneCheck.securityZone?.name}\\nEnhanced verification required.\`
        );
      }
    } catch (error) {
      console.error('Location check failed:', error);
    }
  };
  
  const performVerification = async () => {
    // Implement verification logic
    // ...
  };
  
  return (
    <View>
      {inSecurityZone && (
        <View style={{ backgroundColor: '#fee', padding: 16 }}>
          <Text style={{ color: '#c00', fontWeight: 'bold' }}>
            ⚠️ Security Zone: {zoneName}
          </Text>
          <Text>Required PFF Level: {pffLevel}</Text>
        </View>
      )}
      
      <Button title="Verify Identity" onPress={performVerification} />
    </View>
  );
};
`;

export default {
  exampleBasicZoneCheck,
  exampleVerificationWithStepUp,
  exampleMovementChallenge,
  exampleLocationPermissions,
};

