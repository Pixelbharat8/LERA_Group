import { describe, it, expect, afterEach } from "vitest";
import { isParentDashboardLinkHidden } from "./lera-modules";

const KEY = "NEXT_PUBLIC_LERA_HIDE_PARENT_LINKS";

describe("isParentDashboardLinkHidden", () => {
  const original = process.env[KEY];
  afterEach(() => {
    if (original === undefined) delete process.env[KEY];
    else process.env[KEY] = original;
  });

  it("hides nothing when the env var is unset or blank", () => {
    delete process.env[KEY];
    expect(isParentDashboardLinkHidden("/dashboard/parent/connect")).toBe(false);
    process.env[KEY] = "   ";
    expect(isParentDashboardLinkHidden("/dashboard/parent/connect")).toBe(false);
  });

  it("hides hrefs matching any comma-separated substring", () => {
    process.env[KEY] = "/resources, /connect";
    expect(isParentDashboardLinkHidden("/dashboard/parent/connect")).toBe(true);
    expect(isParentDashboardLinkHidden("/dashboard/parent/resources")).toBe(true);
    expect(isParentDashboardLinkHidden("/dashboard/parent/payments")).toBe(false);
  });
});
