import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis instance (for production)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

// Local fallback for development (when Redis not available)
export class LocalRateLimiter {
  private attempts = new Map<string, { count: number; reset: number }>();

  async limit(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || record.reset < now) {
      this.attempts.set(identifier, { count: 1, reset: now + windowMs });
      return { success: true, remaining: maxAttempts - 1, reset: now + windowMs };
    }

    if (record.count >= maxAttempts) {
      return {
        success: false,
        remaining: 0,
        reset: record.reset,
      };
    }

    record.count++;
    return { success: true, remaining: maxAttempts - record.count, reset: record.reset };
  }
}

// Different limiters for different endpoints
export const loginLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  analytics: true,
}) : new LocalRateLimiter();

export const apiLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
}) : new LocalRateLimiter();

export const uploadLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 uploads per hour
  analytics: true,
}) : new LocalRateLimiter();



// Use local limiter if Redis not configured
export const localLoginLimiter = loginLimiter;
export const localApiLimiter = apiLimiter;