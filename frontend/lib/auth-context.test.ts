import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthUserIdFromCookie } from "./auth-context";

// Hoisted so the mock factory (also hoisted) can reference it. Plain vi.fn() avoids
// js-cookie's get() overloads confusing mockReturnValue's argument type.
const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));
vi.mock("js-cookie", () => ({ default: { get: getMock } }));

describe("getAuthUserIdFromCookie", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when the userData cookie is absent", () => {
    getMock.mockReturnValue(undefined);
    expect(getAuthUserIdFromCookie()).toBeNull();
  });

  it("returns the id field when present", () => {
    getMock.mockReturnValue(JSON.stringify({ id: "user-1", userId: "ignored" }));
    expect(getAuthUserIdFromCookie()).toBe("user-1");
  });

  it("falls back to userId when id is missing", () => {
    getMock.mockReturnValue(JSON.stringify({ userId: "user-2" }));
    expect(getAuthUserIdFromCookie()).toBe("user-2");
  });

  it("decodes a URL-encoded cookie value", () => {
    getMock.mockReturnValue(encodeURIComponent(JSON.stringify({ id: "abc-123" })));
    expect(getAuthUserIdFromCookie()).toBe("abc-123");
  });

  it("returns null on malformed JSON", () => {
    getMock.mockReturnValue("{not json");
    expect(getAuthUserIdFromCookie()).toBeNull();
  });

  it("returns null when neither id nor userId is set", () => {
    getMock.mockReturnValue(JSON.stringify({ name: "no-id" }));
    expect(getAuthUserIdFromCookie()).toBeNull();
  });
});
