/**
 * Rate Limiting Middleware
 * Limits the number of requests from a single IP address within a time window
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
    this.maxRequests = options.max || 100; // 100 requests per window default
    this.message = options.message || 'Too many requests, please try again later.';
    this.statusCode = options.statusCode || 429;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.keyGenerator = options.keyGenerator || ((req) => req.ip || req.connection.remoteAddress);
    
    // Store for tracking requests: { [key]: { count, resetTime } }
    this.requests = new Map();
    
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.requests.entries()) {
        if (now > value.resetTime) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  middleware() {
    return (req, res, next) => {
      const key = this.keyGenerator(req);
      const now = Date.now();
      
      let requestData = this.requests.get(key);
      
      // Initialize or reset if window has passed
      if (!requestData || now > requestData.resetTime) {
        requestData = {
          count: 0,
          resetTime: now + this.windowMs
        };
        this.requests.set(key, requestData);
      }
      
      // Increment request count
      requestData.count++;
      
      // Set rate limit headers
      const remaining = Math.max(0, this.maxRequests - requestData.count);
      const resetTime = Math.ceil(requestData.resetTime / 1000);
      
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);
      
      // Check if limit exceeded
      if (requestData.count > this.maxRequests) {
        const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        
        return res.status(this.statusCode).json({
          error: this.message,
          retryAfter: retryAfter
        });
      }
      
      // Handle conditional skipping on response
      if (this.skipSuccessfulRequests || this.skipFailedRequests) {
        const originalSend = res.send;
        res.send = function (data) {
          const shouldSkip = 
            (this.skipSuccessfulRequests && res.statusCode < 400) ||
            (this.skipFailedRequests && res.statusCode >= 400);
          
          if (shouldSkip && requestData.count > 0) {
            requestData.count--;
          }
          
          return originalSend.call(res, data);
        }.bind(this);
      }
      
      next();
    };
  }

  // Clean up interval on shutdown
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}

/**
 * Create a rate limiter middleware
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.max - Max requests per window (default: 100)
 * @param {string} options.message - Error message when limit exceeded
 * @param {number} options.statusCode - HTTP status code when limit exceeded (default: 429)
 * @param {boolean} options.skipSuccessfulRequests - Don't count successful requests
 * @param {boolean} options.skipFailedRequests - Don't count failed requests
 * @param {Function} options.keyGenerator - Function to generate unique key (default: IP address)
 * @returns {Function} Express middleware function
 */
export const createRateLimiter = (options) => {
  const limiter = new RateLimiter(options);
  return limiter.middleware();
};

// Preset configurations
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many requests from this IP, please try again later.'
});

export const standardRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true // Only count failed attempts
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
});

export default createRateLimiter;
