export interface RateLimitOptions {
  windowMs: number; // time window in milliseconds
  max: number; // max requests per window
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number; // timestamp ms
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimit(identifier: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  // Clean up expired entries
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }

  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    // Start a new window
    const resetAt = now + options.windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { success: true, remaining: options.max - 1, resetAt };
  }

  if (entry.count < options.max) {
    entry.count += 1;
    return { success: true, remaining: options.max - entry.count, resetAt: entry.resetAt };
  }

  // Rate limit exceeded
  return { success: false, remaining: 0, resetAt: entry.resetAt };
}
