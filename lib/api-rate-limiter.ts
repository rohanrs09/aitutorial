/**
 * ==========================================================
 * API RATE LIMITER - SOLID PRINCIPLES
 * ==========================================================
 * 
 * Single Responsibility: Rate limiting and request deduplication
 * Open/Closed: Extensible for new providers without modification
 * Liskov Substitution: All rate limiters follow same interface
 * Interface Segregation: Separate interfaces for different concerns
 * Dependency Inversion: Depend on abstractions, not concrete implementations
 * 
 * Prevents:
 * - Multiple API calls on re-renders
 * - Duplicate requests within time window
 * - Rate limit violations
 * - Excessive API usage
 * ==========================================================
 */

// Rate limiter configuration per provider
interface RateLimitConfig {
  maxRequestsPerMinute: number;
  minRequestInterval: number; // milliseconds between requests
  maxConcurrentRequests: number;
  retryAfterMs: number;
}

// Request tracking
interface RequestTracker {
  timestamp: number;
  key: string;
  inProgress: boolean;
}

// Rate limiter state
class RateLimiterState {
  private requests: Map<string, RequestTracker[]> = new Map();
  private inFlightRequests: Set<string> = new Set();
  private lastRequestTime: Map<string, number> = new Map();

  getRequests(provider: string): RequestTracker[] {
    return this.requests.get(provider) || [];
  }

  addRequest(provider: string, key: string): void {
    const requests = this.getRequests(provider);
    requests.push({ timestamp: Date.now(), key, inProgress: true });
    this.requests.set(provider, requests);
    this.inFlightRequests.add(key);
    this.lastRequestTime.set(provider, Date.now());
  }

  completeRequest(key: string): void {
    this.inFlightRequests.delete(key);
  }

  isInFlight(key: string): boolean {
    return this.inFlightRequests.has(key);
  }

  getLastRequestTime(provider: string): number {
    return this.lastRequestTime.get(provider) || 0;
  }

  cleanupOldRequests(provider: string, olderThan: number): void {
    const requests = this.getRequests(provider);
    const filtered = requests.filter(r => r.timestamp > olderThan);
    this.requests.set(provider, filtered);
  }

  getActiveRequestCount(provider: string): number {
    return this.getRequests(provider).filter(r => r.inProgress).length;
  }
}

// Provider-specific configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  huggingface: {
    maxRequestsPerMinute: 10,
    minRequestInterval: 6000, // 6 seconds between requests
    maxConcurrentRequests: 2,
    retryAfterMs: 60000,
  },
  elevenlabs: {
    maxRequestsPerMinute: 20,
    minRequestInterval: 3000, // 3 seconds between requests
    maxConcurrentRequests: 3,
    retryAfterMs: 30000,
  },
  deepgram: {
    maxRequestsPerMinute: 30,
    minRequestInterval: 2000, // 2 seconds between requests
    maxConcurrentRequests: 5,
    retryAfterMs: 20000,
  },
  openai: {
    maxRequestsPerMinute: 60,
    minRequestInterval: 1000, // 1 second between requests
    maxConcurrentRequests: 10,
    retryAfterMs: 10000,
  },
  gemini: {
    maxRequestsPerMinute: 60,
    minRequestInterval: 1000,
    maxConcurrentRequests: 10,
    retryAfterMs: 10000,
  },
};

// Global state instance
const rateLimiterState = new RateLimiterState();

/**
 * Generate cache key for request deduplication
 */
export function generateRequestKey(provider: string, data: any): string {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  const preview = dataStr.substring(0, 100);
  return `${provider}:${preview}:${dataStr.length}`;
}

/**
 * Check if request should be rate limited
 */
export function shouldRateLimit(provider: string, requestKey: string): {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
} {
  const config = RATE_LIMITS[provider];
  if (!config) {
    // Unknown provider - allow but log warning
    console.warn(`[RateLimiter] Unknown provider: ${provider}`);
    return { allowed: true };
  }

  const now = Date.now();

  // Check 1: Duplicate in-flight request
  if (rateLimiterState.isInFlight(requestKey)) {
    console.log(`[RateLimiter] ⏳ Duplicate request blocked: ${provider}`);
    return {
      allowed: false,
      reason: 'Duplicate request already in progress',
      retryAfterMs: 1000,
    };
  }

  // Check 2: Minimum interval between requests
  const lastRequestTime = rateLimiterState.getLastRequestTime(provider);
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < config.minRequestInterval) {
    const waitTime = config.minRequestInterval - timeSinceLastRequest;
    console.log(`[RateLimiter] ⏱️ Too frequent: ${provider} (wait ${waitTime}ms)`);
    return {
      allowed: false,
      reason: `Too frequent - wait ${Math.ceil(waitTime / 1000)}s`,
      retryAfterMs: waitTime,
    };
  }

  // Check 3: Max concurrent requests
  const activeCount = rateLimiterState.getActiveRequestCount(provider);
  if (activeCount >= config.maxConcurrentRequests) {
    console.log(`[RateLimiter] 🚫 Max concurrent reached: ${provider} (${activeCount}/${config.maxConcurrentRequests})`);
    return {
      allowed: false,
      reason: 'Too many concurrent requests',
      retryAfterMs: config.retryAfterMs,
    };
  }

  // Check 4: Requests per minute limit
  const oneMinuteAgo = now - 60000;
  rateLimiterState.cleanupOldRequests(provider, oneMinuteAgo);
  const recentRequests = rateLimiterState.getRequests(provider);
  if (recentRequests.length >= config.maxRequestsPerMinute) {
    console.log(`[RateLimiter] 📊 Rate limit: ${provider} (${recentRequests.length}/${config.maxRequestsPerMinute} per minute)`);
    return {
      allowed: false,
      reason: 'Rate limit exceeded',
      retryAfterMs: config.retryAfterMs,
    };
  }

  // All checks passed
  return { allowed: true };
}

/**
 * Track request start
 */
export function trackRequestStart(provider: string, requestKey: string): void {
  rateLimiterState.addRequest(provider, requestKey);
  console.log(`[RateLimiter] ✅ Request started: ${provider}`);
}

/**
 * Track request completion
 */
export function trackRequestComplete(requestKey: string): void {
  rateLimiterState.completeRequest(requestKey);
  console.log(`[RateLimiter] ✓ Request completed`);
}

/**
 * Exponential backoff retry helper
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.message?.includes('401') || error.message?.includes('403')) {
        throw error; // Auth errors - don't retry
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.log(`[RateLimiter] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Debounce helper for input handlers
 */
export function createDebouncer(delayMs: number = 300) {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function debounce<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        fn(...args);
        timeoutId = null;
      }, delayMs);
    };
  };
}

/**
 * Throttle helper for frequent events
 */
export function createThrottler(intervalMs: number = 1000) {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function throttle<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;
      
      if (timeSinceLastCall >= intervalMs) {
        lastCallTime = now;
        fn(...args);
      } else if (!timeoutId) {
        // Schedule next call
        const remainingTime = intervalMs - timeSinceLastCall;
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          fn(...args);
          timeoutId = null;
        }, remainingTime);
      }
    };
  };
}

/**
 * Get rate limiter stats for monitoring
 */
export function getRateLimiterStats(provider: string): {
  activeRequests: number;
  recentRequests: number;
  lastRequestTime: number;
  config: RateLimitConfig;
} {
  return {
    activeRequests: rateLimiterState.getActiveRequestCount(provider),
    recentRequests: rateLimiterState.getRequests(provider).length,
    lastRequestTime: rateLimiterState.getLastRequestTime(provider),
    config: RATE_LIMITS[provider] || RATE_LIMITS.openai,
  };
}
