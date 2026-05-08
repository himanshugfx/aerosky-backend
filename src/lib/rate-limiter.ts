import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis instance (for production)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Different limiters for different endpoints
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  analytics: true,
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});

export const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 uploads per hour
  analytics: true,
});

// Local fallback for development (when Redis not available)
export class LocalRateLimiter {
  private attempts = new Map<string, { count: number; reset: number }>();

  async limit(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || record.reset < now) {
      this.attempts.set(identifier, { count: 1, reset: now + windowMs });
      return { success: true, remaining: maxAttempts - 1, retryAfter: 0 };
    }

    if (record.count >= maxAttempts) {
      return {
        success: false,
        remaining: 0,
        retryAfter: Math.ceil((record.reset - now) / 1000),
      };
    }

    record.count++;
    return { success: true, remaining: maxAttempts - record.count, retryAfter: 0 };
  }
}

// Use local limiter if Redis not configured
export const localLoginLimiter = new LocalRateLimiter();
export const localApiLimiter = new LocalRateLimiter();