import { describe, it, expect, afterEach } from "vitest";
import { buildConnectWebSocketUrl } from "./connect-websocket";

const ENV_KEY = "NEXT_PUBLIC_CONNECT_SERVICE_URL";

describe("buildConnectWebSocketUrl", () => {
  const original = process.env[ENV_KEY];
  afterEach(() => {
    if (original === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = original;
  });

  it("throws when no access token is provided", () => {
    expect(() => buildConnectWebSocketUrl("")).toThrow(/accessToken is required/);
  });

  it("falls back to localhost ws with the token as access_token query param", () => {
    delete process.env[ENV_KEY];
    expect(buildConnectWebSocketUrl("tok123")).toBe(
      "ws://localhost:8086/ws/chat?access_token=tok123"
    );
  });

  it("uses wss for an https configured host", () => {
    process.env[ENV_KEY] = "https://connect.example.com";
    expect(buildConnectWebSocketUrl("tok")).toBe(
      "wss://connect.example.com/ws/chat?access_token=tok"
    );
  });

  it("normalizes a path without a leading slash and drops any existing query", () => {
    process.env[ENV_KEY] = "http://h:9000";
    expect(buildConnectWebSocketUrl("t", "ws/calls")).toBe(
      "ws://h:9000/ws/calls?access_token=t"
    );
  });
});
