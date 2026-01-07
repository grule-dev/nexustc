import { describe, expect, it } from "vitest";
import {
  calculateRetryAfter,
  getCurrentWindow,
  getIdentifier,
  getRateLimitKey,
  isLimitExceeded,
} from "./rate-limit";

describe("getIdentifier", () => {
  it("returns user identifier when session exists", () => {
    const result = getIdentifier({
      session: { user: { id: "user-123" } },
      ip: "192.168.1.1",
    });
    expect(result).toBe("user:user-123");
  });

  it("returns ip identifier when no session", () => {
    const result = getIdentifier({
      session: null,
      ip: "192.168.1.1",
    });
    expect(result).toBe("ip:192.168.1.1");
  });

  it("returns ip:unknown when no session and no ip", () => {
    const result = getIdentifier({
      session: null,
      ip: null,
    });
    expect(result).toBe("ip:unknown");
  });

  it("returns ip identifier when session is undefined", () => {
    const result = getIdentifier({
      session: undefined,
      ip: "10.0.0.1",
    });
    expect(result).toBe("ip:10.0.0.1");
  });
});

describe("getRateLimitKey", () => {
  it("generates correct key for fixed window strategy", () => {
    const result = getRateLimitKey({
      strategy: "fixed",
      identifier: "user:123",
      path: ["api", "posts"],
      window: 12_345,
    });
    expect(result).toBe("rl:fw:user:123:api/posts:12345");
  });

  it("generates correct key for sliding window strategy", () => {
    const result = getRateLimitKey({
      strategy: "sliding",
      identifier: "ip:192.168.1.1",
      path: ["api", "users"],
    });
    expect(result).toBe("rl:sw:ip:192.168.1.1:api/users");
  });

  it("handles single path segment", () => {
    const result = getRateLimitKey({
      strategy: "fixed",
      identifier: "user:abc",
      path: ["endpoint"],
      window: 1,
    });
    expect(result).toBe("rl:fw:user:abc:endpoint:1");
  });

  it("handles empty path array", () => {
    const result = getRateLimitKey({
      strategy: "sliding",
      identifier: "ip:unknown",
      path: [],
    });
    expect(result).toBe("rl:sw:ip:unknown:");
  });
});

describe("getCurrentWindow", () => {
  it("calculates window correctly for 60 second window", () => {
    // 90 seconds since epoch
    const result = getCurrentWindow(60, 90_000);
    expect(result).toBe(1); // 90 / 60 = 1
  });

  it("calculates window correctly at window boundary", () => {
    // Exactly 120 seconds
    const result = getCurrentWindow(60, 120_000);
    expect(result).toBe(2); // 120 / 60 = 2
  });

  it("accepts custom timestamp", () => {
    const result = getCurrentWindow(60, 180_000); // 180 seconds
    expect(result).toBe(3); // 180 / 60 = 3
  });

  it("handles different window sizes", () => {
    // 300 seconds
    expect(getCurrentWindow(60, 300_000)).toBe(5);
    expect(getCurrentWindow(30, 300_000)).toBe(10);
    expect(getCurrentWindow(120, 300_000)).toBe(2);
  });
});

describe("calculateRetryAfter", () => {
  it("calculates correct retry time within window", () => {
    // 45 seconds since epoch
    const result = calculateRetryAfter(60, 45_000);
    expect(result).toBe(15); // 60 - (45 % 60) = 15
  });

  it("returns full window at window boundary", () => {
    // Exactly 60 seconds
    const result = calculateRetryAfter(60, 60_000);
    expect(result).toBe(60); // 60 - (60 % 60) = 60
  });

  it("accepts custom timestamp", () => {
    const result = calculateRetryAfter(60, 45_000);
    expect(result).toBe(15);
  });

  it("handles various positions within window", () => {
    // 10 seconds
    expect(calculateRetryAfter(60, 10_000)).toBe(50);

    // 59 seconds
    expect(calculateRetryAfter(60, 59_000)).toBe(1);
  });
});

describe("isLimitExceeded", () => {
  it("returns true when count exceeds limit", () => {
    expect(isLimitExceeded(11, 10)).toBe(true);
  });

  it("returns false when count equals limit", () => {
    expect(isLimitExceeded(10, 10)).toBe(false);
  });

  it("returns false when count is below limit", () => {
    expect(isLimitExceeded(5, 10)).toBe(false);
  });

  it("handles edge case of count = 1, limit = 0", () => {
    expect(isLimitExceeded(1, 0)).toBe(true);
  });
});
