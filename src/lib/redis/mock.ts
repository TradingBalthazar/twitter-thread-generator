/**
 * Mock implementation of Upstash Redis for local development
 * 
 * This provides a simple in-memory implementation of the Upstash Redis API
 * that can be used for local development without requiring an Upstash account.
 * 
 * To use this, modify the imports in your code to use this implementation
 * instead of the real Upstash Redis client.
 * 
 * Example:
 * ```
 * // Instead of:
 * import { redis } from '@/lib/redis';
 * 
 * // Use:
 * import { redis } from '@/lib/redis/mock';
 * ```
 */

// In-memory storage
const store = new Map<string, string>();

// Mock Redis implementation
export const redis = {
  // Get a value
  get: async (key: string): Promise<string | null> => {
    console.log(`[Mock Redis] GET ${key}`);
    return store.get(key) || null;
  },
  
  // Set a value
  set: async (key: string, value: any): Promise<void> => {
    console.log(`[Mock Redis] SET ${key}`);
    store.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  },
  
  // Delete a value
  del: async (key: string): Promise<void> => {
    console.log(`[Mock Redis] DEL ${key}`);
    store.delete(key);
  },
  
  // Get all keys matching a pattern
  keys: async (pattern: string): Promise<string[]> => {
    console.log(`[Mock Redis] KEYS ${pattern}`);
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(store.keys()).filter(key => regex.test(key));
  },
  
  // Check if a key exists
  exists: async (key: string): Promise<number> => {
    console.log(`[Mock Redis] EXISTS ${key}`);
    return store.has(key) ? 1 : 0;
  },
  
  // Get multiple values
  mget: async (...keys: string[]): Promise<(string | null)[]> => {
    console.log(`[Mock Redis] MGET ${keys.join(', ')}`);
    return keys.map(key => store.get(key) || null);
  },
  
  // Set multiple values
  mset: async (...keyValues: (string | number)[]): Promise<void> => {
    console.log(`[Mock Redis] MSET ${keyValues.join(', ')}`);
    for (let i = 0; i < keyValues.length; i += 2) {
      const key = keyValues[i].toString();
      const value = keyValues[i + 1];
      store.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  },
  
  // Increment a value
  incr: async (key: string): Promise<number> => {
    console.log(`[Mock Redis] INCR ${key}`);
    const value = store.get(key);
    const newValue = value ? parseInt(value, 10) + 1 : 1;
    store.set(key, newValue.toString());
    return newValue;
  },
  
  // Expire a key
  expire: async (key: string, seconds: number): Promise<number> => {
    console.log(`[Mock Redis] EXPIRE ${key} ${seconds}`);
    if (!store.has(key)) return 0;
    
    // In this mock implementation, we don't actually expire keys
    // In a real implementation, you would set a timeout to delete the key
    return 1;
  },
};