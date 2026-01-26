/**
 * SOVRA Unified Dashboard - Example Usage
 * 
 * This file demonstrates how to integrate the SOVRA Unified Dashboard
 * into your React application.
 */

import React from 'react';
import { SOVRAUnifiedDashboard } from './SOVRAUnifiedDashboard';

/**
 * Example 1: Basic Usage with Real API Endpoints
 */
export const BasicDashboardExample: React.FC = () => {
  return (
    <SOVRAUnifiedDashboard
      presenceApiEndpoint="https://api.sovra.io/v1/presence"
      sovereignApiEndpoint="https://api.sovra.io/v1/sovereign"
      refreshInterval={5000} // Refresh every 5 seconds
      theme="dark"
    />
  );
};

/**
 * Example 2: Light Theme
 */
export const LightThemeDashboardExample: React.FC = () => {
  return (
    <SOVRAUnifiedDashboard
      presenceApiEndpoint="https://api.sovra.io/v1/presence"
      sovereignApiEndpoint="https://api.sovra.io/v1/sovereign"
      refreshInterval={10000} // Refresh every 10 seconds
      theme="light"
    />
  );
};

/**
 * Example 3: Development Mode with Mock Data
 */
export const MockDashboardExample: React.FC = () => {
  // In development, you can use a mock API server
  // See mockDashboardAPI.ts for implementation
  
  return (
    <SOVRAUnifiedDashboard
      presenceApiEndpoint="http://localhost:3001/api/presence"
      sovereignApiEndpoint="http://localhost:3001/api/sovereign"
      refreshInterval={3000}
      theme="dark"
    />
  );
};

/**
 * Example 4: Custom Refresh Interval
 */
export const CustomRefreshDashboardExample: React.FC = () => {
  return (
    <SOVRAUnifiedDashboard
      presenceApiEndpoint="https://api.sovra.io/v1/presence"
      sovereignApiEndpoint="https://api.sovra.io/v1/sovereign"
      refreshInterval={1000} // Refresh every 1 second (real-time)
      theme="dark"
    />
  );
};

/**
 * Example 5: Embedded in Admin Dashboard
 */
export const AdminDashboardWithSOVRA: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Admin Dashboard</h1>
        <nav>
          <a href="/admin/users">Users</a>
          <a href="/admin/settings">Settings</a>
          <a href="/admin/metrics">Metrics</a>
        </nav>
      </header>
      
      {/* SOVRA Unified Dashboard */}
      <SOVRAUnifiedDashboard
        presenceApiEndpoint="https://api.sovra.io/v1/presence"
        sovereignApiEndpoint="https://api.sovra.io/v1/sovereign"
        refreshInterval={5000}
        theme="dark"
      />
      
      <footer style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p>© 2024 SOVRA Protocol</p>
      </footer>
    </div>
  );
};

/**
 * Example 6: Standalone Dashboard Page
 */
export const StandaloneDashboardPage: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'auto' }}>
      <SOVRAUnifiedDashboard
        presenceApiEndpoint="https://api.sovra.io/v1/presence"
        sovereignApiEndpoint="https://api.sovra.io/v1/sovereign"
        refreshInterval={5000}
        theme="dark"
      />
    </div>
  );
};

/**
 * Example 7: With Error Handling
 */
export const DashboardWithErrorHandling: React.FC = () => {
  const [apiError, setApiError] = React.useState<string | null>(null);
  
  // In production, you might want to handle API errors at a higher level
  React.useEffect(() => {
    const checkAPIHealth = async () => {
      try {
        const response = await fetch('https://api.sovra.io/health');
        if (!response.ok) {
          setApiError('API is currently unavailable');
        }
      } catch (error) {
        setApiError('Failed to connect to API');
      }
    };
    
    checkAPIHealth();
  }, []);
  
  if (apiError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Dashboard Unavailable</h2>
        <p>{apiError}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <SOVRAUnifiedDashboard
      presenceApiEndpoint="https://api.sovra.io/v1/presence"
      sovereignApiEndpoint="https://api.sovra.io/v1/sovereign"
      refreshInterval={5000}
      theme="dark"
    />
  );
};

export default BasicDashboardExample;

