import { kv } from '@vercel/kv';

// Export Vercel KV as redis for compatibility with our changes
export { kv as redis };