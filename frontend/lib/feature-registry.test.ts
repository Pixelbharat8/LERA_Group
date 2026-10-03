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

/**
 * Returns the full `apiFetch(...)` call surrounding `urlIndex` by matching parentheses
 * from the opening one, rather than slicing a fixed number of characters.
 *
 * A 200-character window used to stand in for the call, and it under-reported: push
 * `method: "POST"` past 200 characters — a couple of headers will do it — and the call
 * sailed through the guard. A security guard that silently stops looking is worse than
 * no guard, because the green test is taken as proof.
 */
const enclosingCall = (src: string, urlIndex: number): string => {
  const open = src.lastIndexOf("(", urlIndex);
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")") {
      depth--;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  return src.slice(open); // unbalanced source — scan what there is rather than give up
};

const POST_METHOD = /method:\s*["']POST["']/;
const PERMISSION_URL = /\/api\/user-permissions\/user\/\$\{[^}]+\}`/g;

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
          for (const m of Array.from(src.matchAll(PERMISSION_URL))) {
            if (POST_METHOD.test(enclosingCall(src, m.index!))) {
              offenders.push(path.relative(REPO, full));
            }
          }
        }
      }
    };
    walk(path.join(REPO, "frontend/app"));
    expect(offenders).toEqual([]);
  });

  it("detects a POST whose method sits past a fixed window, which the old guard missed", () => {
    // The previous implementation sliced 200 characters from the URL match. Two headers are
    // enough to push `method:` beyond that, and the call then passed the guard unseen.
    const padded =
      'await apiFetch(`/api/user-permissions/user/${id}`, {\n' +
      '  headers: { "Content-Type": "application/json", "X-Trace": "' + "x".repeat(140) + '" },\n' +
      '  method: "POST",\n  body: "{}",\n});';
    const url = padded.search(/\/api\/user-permissions/);

    expect(POST_METHOD.test(enclosingCall(padded, url))).toBe(true);
    expect(padded.slice(url, url + 200)).not.toMatch(POST_METHOD); // the old window's blind spot
  });

  it("does not flag the PUT the editors are supposed to use", () => {
    const put = 'await apiFetch(`/api/user-permissions/user/${id}`, { method: "PUT", body: b });';
    expect(POST_METHOD.test(enclosingCall(put, put.search(/\/api\/user-permissions/)))).toBe(false);
  });
});
