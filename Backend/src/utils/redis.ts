import Redis from 'ioredis';
import { env } from '../config/env';

let hasLoggedRedisError = false;

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 2) {
      return null;
    }
    return 1000;
  },
});

redis.on('error', (err) => {
  if (!hasLoggedRedisError) {
    hasLoggedRedisError = true;
    console.warn('[Redis Notice] Redis server offline (using in-memory fallback store).');
  }
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.connect().catch(() => {});

export default redis;
