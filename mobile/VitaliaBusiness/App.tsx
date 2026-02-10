/**
 * Vitalia Business - Kiosk App for Authorized Agents
 * 
 * Features:
 * 1. Assisted Registration - Agent scans 3rd party and mints 20 VIDA (10 User / 10 Vault)
 * 2. Liquidity Provider - Agent pays out physical cash for nVIDA
 * 
 * "Empowering agents. Onboarding the nation."
 * 
 * Born in Lagos, Nigeria. Built for Agents.
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
import AgentLoginScreen from './screens/AgentLoginScreen';
import AgentDashboardScreen from './screens/AgentDashboardScreen';
import AssistedRegistrationScreen from './screens/AssistedRegistrationScreen';
import LiquidityProviderScreen from './screens/LiquidityProviderScreen';

// Import services
import { checkAgentAuth, getAgentData } from './services/AgentService';

const Stack = createStackNavigator();

// ============ TYPES ============

interface AgentData {
  agentId: string;
  agentName: string;
  phoneNumber: string;
  isVerified: boolean;
  totalRegistrations: number;
  totalLiquidityProvided: number;
  commission: number;
}

// ============ MAIN APP ============

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [agentData, setAgentData] = useState<AgentData | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check if agent is authenticated
   */
  const checkAuthStatus = async () => {
    try {
      const isAuth = await checkAgentAuth();

      if (isAuth) {
        const data = await getAgentData();
        setAgentData(data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[VitaliaBusiness] Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle successful login
   */
  const handleLoginSuccess = (data: AgentData) => {
    setAgentData(data);
    setIsAuthenticated(true);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    setAgentData(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Vitalia Business</Text>
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
        initialRouteName={isAuthenticated ? 'Dashboard' : 'Login'}
      >
        {/* Agent Login */}
        <Stack.Screen name="Login">
          {(props) => (
            <AgentLoginScreen
              {...props}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
        </Stack.Screen>

        {/* Agent Dashboard */}
        <Stack.Screen name="Dashboard">
          {(props) => (
            <AgentDashboardScreen
              {...props}
              agentData={agentData}
              onLogout={handleLogout}
            />
          )}
        </Stack.Screen>

        {/* Assisted Registration */}
        <Stack.Screen name="AssistedRegistration">
          {(props) => (
            <AssistedRegistrationScreen
              {...props}
              agentData={agentData}
            />
          )}
        </Stack.Screen>

        {/* Liquidity Provider */}
        <Stack.Screen name="LiquidityProvider">
          {(props) => (
            <LiquidityProviderScreen
              {...props}
              agentData={agentData}
            />
          )}
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
    color: '#FF6B35',
  },
});

