/**
 * SOVRN Protocol - Temporal Cache Service
 * Nigerian Spoke Implementation
 * 
 * Redis-based caching for fast-track verifications
 * Cache TTL: 24 hours
 */

import { createClient, RedisClientType } from 'redis';
import { TemporalCacheEntry } from '@sovrn/shared';

// Redis client instance
let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<void> {
  if (redisClient) {
    return; // Already initialized
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis: Max reconnection attempts reached');
          return new Error('Redis connection failed');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis: Connected successfully');
  });

  await redisClient.connect();
}

/**
 * Get Redis client (initialize if needed)
 */
async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    await initializeRedis();
  }
  return redisClient!;
}

/**
 * Generate cache key for a citizen
 */
function getCacheKey(citizenId: string): string {
  return `fasttrack:verified:${citizenId}`;
}

/**
 * Store verification in temporal cache
 * TTL: 24 hours (86400 seconds)
 */
export async function setCacheEntry(entry: TemporalCacheEntry): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const key = getCacheKey(entry.citizen_id);
    const value = JSON.stringify(entry);
    
    // Set with 24-hour expiration
    await client.setEx(key, 86400, value);
    
    console.log(`Temporal cache: Stored entry for citizen ${entry.citizen_id}`);
    return true;
  } catch (error) {
    console.error('Temporal cache: Error storing entry:', error);
    return false;
  }
}

/**
 * Retrieve verification from temporal cache
 */
export async function getCacheEntry(citizenId: string): Promise<TemporalCacheEntry | null> {
  try {
    const client = await getRedisClient();
    const key = getCacheKey(citizenId);
    const value = await client.get(key);
    
    if (!value) {
      return null;
    }
    
    const entry: TemporalCacheEntry = JSON.parse(value);
    
    // Check if entry is still valid
    const expiresAt = new Date(entry.expires_at);
    if (expiresAt <= new Date()) {
      // Entry expired, delete it
      await deleteCacheEntry(citizenId);
      return null;
    }
    
    return entry;
  } catch (error) {
    console.error('Temporal cache: Error retrieving entry:', error);
    return null;
  }
}

/**
 * Update verification count in cache
 */
export async function incrementVerificationCount(
  citizenId: string,
  context: string
): Promise<boolean> {
  try {
    const entry = await getCacheEntry(citizenId);
    if (!entry) {
      return false;
    }
    
    // Increment count and add context if not already present
    entry.verification_count += 1;
    if (!entry.contexts.includes(context)) {
      entry.contexts.push(context);
    }
    
    // Update cache
    return await setCacheEntry(entry);
  } catch (error) {
    console.error('Temporal cache: Error incrementing count:', error);
    return false;
  }
}

/**
 * Delete verification from temporal cache
 */
export async function deleteCacheEntry(citizenId: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const key = getCacheKey(citizenId);
    await client.del(key);
    
    console.log(`Temporal cache: Deleted entry for citizen ${citizenId}`);
    return true;
  } catch (error) {
    console.error('Temporal cache: Error deleting entry:', error);
    return false;
  }
}

/**
 * Check if citizen has valid cache entry
 */
export async function isCached(citizenId: string): Promise<boolean> {
  const entry = await getCacheEntry(citizenId);
  return entry !== null;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis: Connection closed');
  }
}

