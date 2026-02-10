/**
 * Agent Service - Agent authentication and data management
 */

export interface AgentData {
  agentId: string;
  agentName: string;
  phoneNumber: string;
  isVerified: boolean;
  totalRegistrations: number;
  totalLiquidityProvided: number;
  commission: number;
}

// Mock agent database (in production, use backend API)
const agents = new Map<string, AgentData>();

// Initialize test agent
agents.set('agent_001', {
  agentId: 'agent_001',
  agentName: 'John Doe',
  phoneNumber: '+234-800-111-1111',
  isVerified: true,
  totalRegistrations: 0,
  totalLiquidityProvided: 0,
  commission: 0,
});

/**
 * Check if agent is authenticated
 */
export async function checkAgentAuth(): Promise<boolean> {
  // In production, check secure storage or backend
  return true; // For demo, always authenticated
}

/**
 * Get agent data
 */
export async function getAgentData(): Promise<AgentData> {
  // In production, call backend API
  return agents.get('agent_001')!;
}

/**
 * Authenticate agent
 */
export async function authenticateAgent(agentId: string, pin: string): Promise<AgentData | null> {
  // In production, call backend API with secure authentication
  const agent = agents.get(agentId);
  
  if (agent && agent.isVerified) {
    return agent;
  }
  
  return null;
}

