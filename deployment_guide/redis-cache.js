// server/redis-cache.js - Redis caching layer for distributed system

import Redis from 'redis';

class RedisCache {
  constructor() {
    this.client = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error('Max retries exceeded');
          return Math.min(retries * 50, 500);
        },
      },
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        return Math.min(options.attempt * 100, 3000);
      },
    });

    this.client.on('error', (err) => console.error('❌ Redis error:', err));
    this.client.on('connect', () => console.log('✅ Redis connected'));
    this.client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
  }

  async connect() {
    try {
      await this.client.connect();
      await this.client.ping();
      console.log('✅ Redis cache initialized');
    } catch (err) {
      console.warn('⚠️ Redis connection failed, caching disabled:', err.message);
      this.enabled = false;
    }
  }

  // Cache timeout constants
  static CACHE_TIMES = {
    leaderboard: 5 * 60,        // 5 minutes
    userProfile: 15 * 60,       // 15 minutes
    articles: 30 * 60,          // 30 minutes
    courses: 1 * 60 * 60,       // 1 hour
    quizzes: 2 * 60 * 60,       // 2 hours
    userAttempt: 10 * 60,       // 10 minutes
  };

  async get(key) {
    try {
      if (!this.client.isOpen) return null;
      return await this.client.get(key);
    } catch (err) {
      console.warn(`Redis GET failed for ${key}:`, err.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      if (!this.client.isOpen) return false;
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`Redis SET failed for ${key}:`, err.message);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.client.isOpen) return false;
      await this.client.del(key);
      return true;
    } catch (err) {
      console.warn(`Redis DEL failed for ${key}:`, err.message);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    try {
      if (!this.client.isOpen) return 0;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        return await this.client.del(keys);
      }
      return 0;
    } catch (err) {
      console.warn(`Redis pattern invalidation failed for ${pattern}:`, err.message);
      return 0;
    }
  }

  async incr(key) {
    try {
      if (!this.client.isOpen) return null;
      return await this.client.incr(key);
    } catch (err) {
      console.warn(`Redis INCR failed for ${key}:`, err.message);
      return null;
    }
  }

  async setWithExpiry(key, value, ttlSeconds) {
    try {
      if (!this.client.isOpen) return false;
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`Redis SET with expiry failed for ${key}:`, err.message);
      return false;
    }
  }

  async getOrSet(key, ttlSeconds, fetchFunction) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch data
      const data = await fetchFunction();

      // Store in cache
      await this.set(key, data, ttlSeconds);

      return data;
    } catch (err) {
      console.warn(`Redis getOrSet failed for ${key}:`, err.message);
      // Fall back to fetching directly
      return fetchFunction();
    }
  }

  async disconnect() {
    try {
      if (this.client.isOpen) {
        await this.client.quit();
        console.log('✅ Redis disconnected');
      }
    } catch (err) {
      console.error('Error disconnecting Redis:', err);
    }
  }
}

const redisCache = new RedisCache();

export default redisCache;
