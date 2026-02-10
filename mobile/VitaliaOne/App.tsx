/**
 * Vitalia One - User App
 * 
 * Conditional Entry:
 * - New Users → Welcome Screen (Master Pulse Scan + Truth-Bundle Registration)
 * - Existing Users → Vault Screen (Dashboard)
 * 
 * Screens:
 * 1. The Welcome - Master Pulse Scan & Registration
 * 2. The Vault - VIDA/nVIDA Balance Dashboard
 * 3. The Bridge - Buy/Sell VIDA
 * 
 * "One pulse, one identity, one nation."
 * 
 * Born in Lagos, Nigeria. Built for Everyone.
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import WelcomeScreen from './screens/WelcomeScreen';
import VaultScreen from './screens/VaultScreen';
import BridgeScreen from './screens/BridgeScreen';

// Import services
import { checkUserExists, getUserData } from './services/UserService';

const Stack = createStackNavigator();

// ============ TYPES ============

interface UserData {
  userId: string;
  phoneNumber: string;
  vidaBalance: number;
  nVidaBalance: number;
  isRegistered: boolean;
  truthBundleHash?: string;
}

// ============ MAIN APP ============

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  /**
   * Check if user is already registered
   */
  const checkRegistrationStatus = async () => {
    try {
      // In production, check device storage or backend
      const phoneNumber = await getDevicePhoneNumber();
      const exists = await checkUserExists(phoneNumber);

      if (exists) {
        const data = await getUserData(phoneNumber);
        setUserData(data);
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
      }
    } catch (error) {
      console.error('[VitaliaOne] Registration check failed:', error);
      setIsRegistered(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get device phone number (placeholder)
   */
  const getDevicePhoneNumber = async (): Promise<string> => {
    // In production, use device API or user input
    return '+234-800-000-0000';
  };

  /**
   * Handle successful registration
   */
  const handleRegistrationComplete = (data: UserData) => {
    setUserData(data);
    setIsRegistered(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D4AA" />
        <Text style={styles.loadingText}>Vitalia</Text>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0A0E27' },
        }}
        initialRouteName={isRegistered ? 'Vault' : 'Welcome'}
      >
        {/* Welcome Screen - New Users Only */}
        <Stack.Screen name="Welcome">
          {(props) => (
            <WelcomeScreen
              {...props}
              onRegistrationComplete={handleRegistrationComplete}
            />
          )}
        </Stack.Screen>

        {/* Vault Screen - Dashboard */}
        <Stack.Screen name="Vault">
          {(props) => <VaultScreen {...props} userData={userData} />}
        </Stack.Screen>

        {/* Bridge Screen - Buy/Sell */}
        <Stack.Screen name="Bridge">
          {(props) => <BridgeScreen {...props} userData={userData} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E27',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D4AA',
  },
});

