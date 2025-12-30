/**
 * Pure functions for rate limiting logic.
 * These functions have no side effects and are easily testable.
 */

type IdentifierParams = {
  session?: { user: { id: string } } | null;
  ip?: string | null;
};

/**
 * Generates a unique identifier for rate limiting based on user session or IP.
 */
export function getIdentifier({ session, ip }: IdentifierParams): string {
  if (session?.user) {
    return `user:${session.user.id}`;
  }
  return `ip:${ip ?? "unknown"}`;
}

type RateLimitKeyParams = {
  strategy: "fixed" | "sliding";
  identifier: string;
  path: readonly string[];
  window?: number;
};

/**
 * Generates a Redis key for rate limiting.
 */
export function getRateLimitKey({
  strategy,
  identifier,
  path,
  window,
}: RateLimitKeyParams): string {
  const pathStr = path.join("/");

  if (strategy === "fixed") {
    return `rl:fw:${identifier}:${pathStr}:${window}`;
  }
  return `rl:sw:${identifier}:${pathStr}`;
}

/**
 * Calculates the current window number for fixed window rate limiting.
 */
export function getCurrentWindow(
  windowSeconds: number,
  now: number = Date.now()
): number {
  return Math.floor(now / 1000 / windowSeconds);
}

/**
 * Calculates the retry-after time in seconds until the current window resets.
 */
export function calculateRetryAfter(
  windowSeconds: number,
  now: number = Date.now()
): number {
  return windowSeconds - (Math.floor(now / 1000) % windowSeconds);
}

/**
 * Checks if the window rate limit has been exceeded.
 */
export function isLimitExceeded(count: number, limit: number): boolean {
  return count > limit;
}
