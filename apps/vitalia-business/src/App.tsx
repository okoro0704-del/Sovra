/**
 * Vitalia Business - Agent/Kiosk App
 * 
 * "Empowering agents. Onboarding the nation."
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import HomeScreen from './screens/HomeScreen';
import AssistedRegistrationScreen from './screens/AssistedRegistrationScreen';
import LiquidityProviderScreen from './screens/LiquidityProviderScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0A0E27' },
        }}
        initialRouteName="Home"
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AssistedRegistration" component={AssistedRegistrationScreen} />
        <Stack.Screen name="LiquidityProvider" component={LiquidityProviderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

