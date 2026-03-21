import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitOptions } from './rate-limit';

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 60_000,
  max: 60,
};

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: Partial<RateLimitOptions>
): (req: NextRequest) => Promise<NextResponse> {
  const resolvedOptions: RateLimitOptions = { ...DEFAULT_OPTIONS, ...options };

  return async (req: NextRequest): Promise<NextResponse> => {
    const identifier =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';

    const result = rateLimit(identifier, resolvedOptions);

    const rateLimitHeaders = {
      'X-RateLimit-Limit': String(resolvedOptions.max),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.resetAt),
    };

    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders,
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    const response = await handler(req);

    // Add rate limit headers to the successful response
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
