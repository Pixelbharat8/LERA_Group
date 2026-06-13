import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getNativeAuthToken,
  saveNativeAuthToken,
  clearNativeAuthToken,
  hydrateNativeAuthToken,
} from "./token-store";

// Avoid touching the real Capacitor Preferences plugin during the native-path tests.
vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({ value: "persisted-jwt" }),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}));

function setNative(on: boolean) {
  if (on) {
    (window as unknown as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true };
  } else {
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
  }
}

describe("native token-store", () => {
  beforeEach(async () => {
    await clearNativeAuthToken(); // reset in-memory token between tests
    setNative(false);
  });
  afterEach(() => setNative(false));

  it("is a no-op on web: save does not expose a Bearer token", async () => {
    await saveNativeAuthToken("jwt-web");
    expect(getNativeAuthToken()).toBeNull();
  });

  it("on native, a saved token becomes the in-memory Bearer token", async () => {
    setNative(true);
    await saveNativeAuthToken("jwt-native");
    expect(getNativeAuthToken()).toBe("jwt-native");
  });

  it("ignores empty/undefined tokens", async () => {
    setNative(true);
    await saveNativeAuthToken(undefined);
    await saveNativeAuthToken("");
    expect(getNativeAuthToken()).toBeNull();
  });

  it("hydrate loads a persisted token on native, no-op on web", async () => {
    await hydrateNativeAuthToken(); // web: stays null
    expect(getNativeAuthToken()).toBeNull();

    setNative(true);
    await hydrateNativeAuthToken(); // native: loads mocked "persisted-jwt"
    expect(getNativeAuthToken()).toBe("persisted-jwt");
  });

  it("clear wipes the in-memory token", async () => {
    setNative(true);
    await saveNativeAuthToken("jwt-native");
    await clearNativeAuthToken();
    expect(getNativeAuthToken()).toBeNull();
  });
});
