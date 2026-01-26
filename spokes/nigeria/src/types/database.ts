/**
 * TypeScript database types for SOVRN Protocol
 * Generated from Supabase schema
 */

export type CitizenStatus = 'active' | 'suspended' | 'revoked';
export type TierLevel = 'tier1' | 'tier2' | 'tier3';

/**
 * Citizen Registry Table
 */
export interface CitizenRegistry {
  id: string;
  pff_hash: string;
  nin_hash: string | null;
  status: CitizenStatus;
  created_at: string;
}

/**
 * Registered Entities Table
 */
export interface RegisteredEntity {
  id: string;
  name: string;
  api_key_hash: string;
  tier_level: TierLevel;
  created_at: string;
}

/**
 * Consent Logs Table
 */
export interface ConsentLog {
  id: string;
  citizen_id: string;
  entity_id: string;
  biometric_signature: string;
  timestamp: string;
}

/**
 * Database schema type definitions
 */
export interface Database {
  public: {
    Tables: {
      citizen_registry: {
        Row: CitizenRegistry;
        Insert: Omit<CitizenRegistry, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<CitizenRegistry, 'id' | 'created_at'>>;
      };
      registered_entities: {
        Row: RegisteredEntity;
        Insert: Omit<RegisteredEntity, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<RegisteredEntity, 'id' | 'created_at'>>;
      };
      consent_logs: {
        Row: ConsentLog;
        Insert: Omit<ConsentLog, 'id' | 'timestamp'> & {
          id?: string;
          timestamp?: string;
        };
        Update: Partial<Omit<ConsentLog, 'id' | 'timestamp'>>;
      };
    };
  };
}
