import rateLimit from "express-rate-limit";

// Rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts from this IP. Please try again after 15 minutes." }
});

// Rate limiter for text commands
export const commandRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Command rate limit exceeded. Please wait a moment." }
});

// General API rate limiter
export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false
});
