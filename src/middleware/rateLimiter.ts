import type { Request, Response, NextFunction } from "express";

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RequestData {
  count: number;
  resetTime: number;
}

/**
 * Rate Limiting Middleware
 * Limits the number of requests from a single IP address within a time window
 */
class RateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly message: string;
  private readonly statusCode: number;
  private readonly skipSuccessfulRequests: boolean;
  private readonly skipFailedRequests: boolean;
  private readonly keyGenerator: (req: Request) => string;
  private readonly requests: Map<string, RequestData>;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(options: RateLimiterOptions = {}) {
    this.windowMs = options.windowMs ?? 15 * 60 * 1000;
    this.maxRequests = options.max ?? 100;
    this.message = options.message ?? "Too many requests, please try again later.";
    this.statusCode = options.statusCode ?? 429;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests ?? false;
    this.skipFailedRequests = options.skipFailedRequests ?? false;
    this.keyGenerator = options.keyGenerator ?? ((req: Request) => (req.ip ?? req.socket.remoteAddress ?? "unknown"));

    this.requests = new Map<string, RequestData>();

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.requests.entries()) {
        if (now > value.resetTime) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  private formatRetryAfter(seconds: number): string {
    if (seconds >= 60) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.keyGenerator(req);
      const now = Date.now();

      let requestData = this.requests.get(key);

      if (!requestData || now > requestData.resetTime) {
        requestData = { count: 0, resetTime: now + this.windowMs };
        this.requests.set(key, requestData);
      }

      requestData.count++;

      const remaining = Math.max(0, this.maxRequests - requestData.count);
      const resetTime = Math.ceil(requestData.resetTime / 1000);

      res.setHeader("X-RateLimit-Limit", this.maxRequests);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", resetTime);

      if (requestData.count > this.maxRequests) {
        const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);
        res.setHeader("Retry-After", retryAfter);
        return res.status(this.statusCode).json({
          error: `${this.message}${retryAfter ? ` Try again in ${this.formatRetryAfter(retryAfter)}.` : ""}`,
          retryAfter,
        });
      }

      if (this.skipSuccessfulRequests || this.skipFailedRequests) {
        const skipSuccess = this.skipSuccessfulRequests;
        const skipFailed = this.skipFailedRequests;
        const originalSend = res.send.bind(res);
        res.send = function (this: Response, data: Parameters<Response["send"]>[0]) {
          const shouldSkip =
            (skipSuccess && res.statusCode < 400) ||
            (skipFailed && res.statusCode >= 400);
          if (shouldSkip && requestData && requestData.count > 0) {
            requestData.count--;
          }
          return originalSend(data);
        };
      }

      next();
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

/**
 * Create a rate limiter middleware
 */
export const createRateLimiter = (options: RateLimiterOptions = {}) => {
  const limiter = new RateLimiter(options);
  return limiter.middleware();
};

export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many requests",
});

// more aggressive limiter for those ai endpoints,
// i dey avoid ai bills 😭
export const veryStrictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // 6 requests per window
  message: 'Too many requests'
});


export const standardRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 9, // 9 login attempts per window
  message: 'Too many login attempts',
  skipSuccessfulRequests: true // Only count failed attempts
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
});

export const speechToTextRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 11, // 11 requests per minute
});

// Strict limiter for password-reset requests — max 5 per IP per 15 minutes
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests",
});


export default createRateLimiter;
