/**
 * SOVRN Protocol - Hub-Spoke Handshake Service
 * Global Hub Implementation
 * 
 * Asynchronous communication layer between Global Hub and Spokes
 * Enables non-blocking verification, cache synchronization, and trust updates
 */

import { HubSpokeHandshake } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Message Queue Interface
 * Implementations can use RabbitMQ, Redis Pub/Sub, AWS SQS, etc.
 */
export interface MessageQueue {
  publish(message: HubSpokeHandshake): Promise<boolean>;
  subscribe(spokeId: string, handler: (message: HubSpokeHandshake) => void): Promise<void>;
  unsubscribe(spokeId: string): Promise<void>;
}

/**
 * Create a verification request message from Hub to Spoke
 */
export function createVerificationRequest(params: {
  spokeId: string;
  citizenId: string;
  pffHash: string;
  requesterId: string;
  context: string;
  priority?: 'critical' | 'high' | 'normal' | 'low';
}): HubSpokeHandshake {
  return {
    message_id: uuidv4(),
    spoke_id: params.spokeId,
    message_type: 'verification_request',
    payload: {
      citizen_id: params.citizenId,
      pff_hash: params.pffHash,
      requester_id: params.requesterId,
      context: params.context
    },
    timestamp: new Date().toISOString(),
    priority: params.priority || 'normal'
  };
}

/**
 * Create a verification response message from Spoke to Hub
 */
export function createVerificationResponse(params: {
  spokeId: string;
  requestMessageId: string;
  success: boolean;
  trustScore?: number;
  trustLevel?: string;
  verificationId?: string;
  cached?: boolean;
  responseTimeMs?: number;
}): HubSpokeHandshake {
  return {
    message_id: uuidv4(),
    spoke_id: params.spokeId,
    message_type: 'verification_response',
    payload: {
      request_message_id: params.requestMessageId,
      success: params.success,
      trust_score: params.trustScore,
      trust_level: params.trustLevel,
      verification_id: params.verificationId,
      cached: params.cached,
      response_time_ms: params.responseTimeMs
    },
    timestamp: new Date().toISOString(),
    priority: 'high'
  };
}

/**
 * Create a cache sync message
 * Used to synchronize temporal cache entries across spokes
 */
export function createCacheSyncMessage(params: {
  spokeId: string;
  citizenId: string;
  trustScore: number;
  trustLevel: string;
  expiresAt: string;
  action: 'create' | 'update' | 'delete';
}): HubSpokeHandshake {
  return {
    message_id: uuidv4(),
    spoke_id: params.spokeId,
    message_type: 'cache_sync',
    payload: {
      citizen_id: params.citizenId,
      trust_score: params.trustScore,
      trust_level: params.trustLevel,
      expires_at: params.expiresAt,
      action: params.action
    },
    timestamp: new Date().toISOString(),
    priority: 'normal'
  };
}

/**
 * Create a trust update message
 * Used when trust scores need to be recalculated globally
 */
export function createTrustUpdateMessage(params: {
  spokeId: string;
  citizenId: string;
  newTrustScore: number;
  newTrustLevel: string;
  reason: string;
}): HubSpokeHandshake {
  return {
    message_id: uuidv4(),
    spoke_id: params.spokeId,
    message_type: 'trust_update',
    payload: {
      citizen_id: params.citizenId,
      new_trust_score: params.newTrustScore,
      new_trust_level: params.newTrustLevel,
      reason: params.reason
    },
    timestamp: new Date().toISOString(),
    priority: 'high'
  };
}

/**
 * In-Memory Message Queue Implementation
 * For development and testing
 * Production should use Redis Pub/Sub, RabbitMQ, or AWS SQS
 */
export class InMemoryMessageQueue implements MessageQueue {
  private subscribers: Map<string, (message: HubSpokeHandshake) => void> = new Map();

  async publish(message: HubSpokeHandshake): Promise<boolean> {
    const handler = this.subscribers.get(message.spoke_id);
    if (handler) {
      // Simulate async delivery
      setTimeout(() => handler(message), 10);
      return true;
    }
    console.warn(`No subscriber found for spoke: ${message.spoke_id}`);
    return false;
  }

  async subscribe(spokeId: string, handler: (message: HubSpokeHandshake) => void): Promise<void> {
    this.subscribers.set(spokeId, handler);
    console.log(`Subscribed to messages for spoke: ${spokeId}`);
  }

  async unsubscribe(spokeId: string): Promise<void> {
    this.subscribers.delete(spokeId);
    console.log(`Unsubscribed from messages for spoke: ${spokeId}`);
  }
}

