/**
 * Vitalia One - Personal Sovereign Identity App
 * 
 * "Your money. Your phone. That's it."
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { isUserRegistered } from '@vitalia/contracts/src/SovereignChain';

// Screens
import GenesisRegistrationScreen from './screens/GenesisRegistrationScreen';
import LifeOSDashboard from './screens/LifeOSDashboard';
import WelcomeScreen from './screens/WelcomeScreen';
import VaultScreen from './screens/VaultScreen';
import BridgeScreen from './screens/BridgeScreen';
import HealthDashboard from './screens/HealthDashboard';
import HospitalVerificationScreen from './screens/HospitalVerificationScreen';
import SentinelScreen from './screens/SentinelScreen';
import PharmacyBridgeScreen from './screens/PharmacyBridgeScreen';
import BorderCrossScreen from './screens/BorderCrossScreen';
import WitnessModeScreen from './screens/WitnessModeScreen';
import ExileVaultScreen from './screens/ExileVaultScreen';
import SovrynScreen from './screens/SovrynScreen';
import SovrynWealthScreen from './screens/SovrynWealthScreen';
import UnifiedVaultScreen from './screens/UnifiedVaultScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  const checkRegistrationStatus = async () => {
    // In production, get phone number from device or secure storage
    const phone = '+234-800-000-0000';
    setPhoneNumber(phone);

    const registered = await isUserRegistered(phone);
    setIsRegistered(registered);
  };

  if (isRegistered === null) {
    return null; // Loading
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
        <Stack.Screen name="GenesisRegistration" component={GenesisRegistrationScreen} />
        <Stack.Screen name="LifeOSDashboard" component={LifeOSDashboard} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Vault" component={VaultScreen} />
        <Stack.Screen name="Bridge" component={BridgeScreen} />
        <Stack.Screen name="Health" component={HealthDashboard} />
        <Stack.Screen name="HospitalVerification" component={HospitalVerificationScreen} />
        <Stack.Screen name="Sentinel" component={SentinelScreen} />
        <Stack.Screen name="PharmacyBridge" component={PharmacyBridgeScreen} />
        <Stack.Screen name="BorderCross" component={BorderCrossScreen} />
        <Stack.Screen name="WitnessMode" component={WitnessModeScreen} />
        <Stack.Screen name="ExileVault" component={ExileVaultScreen} />
        <Stack.Screen name="Sovryn" component={SovrynScreen} />
        <Stack.Screen name="SovrynWealth" component={SovrynWealthScreen} />
        <Stack.Screen name="UnifiedVault" component={UnifiedVaultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

