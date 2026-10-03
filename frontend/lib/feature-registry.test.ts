import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { FEATURES, partialPermissionBody } from "./feature-registry";

/**
 * The switch list used to be copied into every editor, and the copies drifted: two of the
 * three editors wrote a full POST that never mentioned Social Media and hard-coded every
 * service switch to on, so saving a user there quietly undid Feature Management. These
 * tests pin the single list to what identity_service actually returns and accepts.
 */
const REPO = path.resolve(__dirname, "..", "..");
const IDENTITY = path.join(REPO, "backend/identity_service/src/main/java/com/lera/identity_service");
const read = (rel: string) => fs.readFileSync(path.join(IDENTITY, rel), "utf8");

describe("feature registry parity with identity_service", () => {
  it("lists exactly the switch fields UserPermissionDTO returns", () => {
    const dtoFields = Array.from(read("dto/UserPermissionDTO.java").matchAll(/private Boolean (\w+);/g))
      .map((m) => m[1])
      .filter((f) => f !== "configured"); // response metadata, not a switch
    expect(dtoFields.length).toBeGreaterThan(0);
    expect(FEATURES.map((f) => f.field).sort()).toEqual(dtoFields.sort());
  });

  it("writes exactly the keys the PUT handler reads", () => {
    const controller = read("controller/UserPermissionController.java");
    const putStart = controller.indexOf('@PutMapping("/user/{userId}")');
    expect(putStart).toBeGreaterThan(-1);
    const putBody = controller.slice(putStart, controller.indexOf("userPermissionRepository.save", putStart));
    const putKeys = Array.from(putBody.matchAll(/permissions\.containsKey\("(\w+)"\)/g)).map((m) => m[1]);
    expect(putKeys.length).toBeGreaterThan(0);
    expect(FEATURES.map((f) => f.putKey).sort()).toEqual(putKeys.sort());
  });
});

describe("partialPermissionBody", () => {
  it("sends only the switches the editor holds, so the rest keep their saved values", () => {
    const body = partialPermissionBody({ dashboard: true, payments: false, ai_assistant: true });
    expect(body).toEqual({ dashboard: true, payments: false, ai_assistant: true });
    expect(body).not.toHaveProperty("socialMedia");
    expect(body).not.toHaveProperty("academyServiceEnabled");
  });

  it("drops keys PUT would ignore and coerces missing values to false", () => {
    // `aiAssistant` is the read-side name; PUT silently ignores it.
    expect(partialPermissionBody({ aiAssistant: true, userId: "x", reports: undefined })).toEqual({ reports: false });
  });
});

describe("permission editors", () => {
  it("never full-replace a user's switches with POST", () => {
    // POST overwrites all 22 columns, defaulting whatever the body omits. Every editor shows
    // a subset, so each must PUT only what it shows (see partialPermissionBody).
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name)) {
          const src = fs.readFileSync(full, "utf8");
          for (const m of Array.from(src.matchAll(/\/api\/user-permissions\/user\/\$\{[^}]+\}`/g))) {
            const call = src.slice(m.index, m.index! + 200);
            if (/method:\s*["']POST["']/.test(call.slice(0, call.indexOf("body:") >>> 0))) {
              offenders.push(path.relative(REPO, full));
            }
          }
        }
      }
    };
    walk(path.join(REPO, "frontend/app"));
    expect(offenders).toEqual([]);
  });
});
