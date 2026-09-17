import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * A mutation must not report success unless it succeeded.
 *
 * The shape this catches: a POST/PUT/PATCH/DELETE whose failure is discarded with a
 * `.catch(() => {})`, followed immediately by a success signal — closing the modal, adding the
 * row to the list, clearing the form. A save that failed then looks exactly like one that worked,
 * and only a reload reveals otherwise. Found this way:
 *
 *   - staff/messages closed the compose window on a send that had thrown;
 *   - chairman/marketing/ads-campaigns fell through to a "local add for demo";
 *   - chairman/custom-fields removed a row whose DELETE had failed;
 *   - payments/fee-rules did both, and invented four billing rules besides.
 *
 * Reading is different: a failed GET showing an empty list is honest, so only mutations count.
 *
 * One carve-out, listed below: an automatic read-receipt. Marking a conversation read is not
 * something the user asserted, it is a side effect of opening it, and putting the unread badge
 * back while they are reading would be worse than letting it fail quietly.
 */

const REPO = path.resolve(__dirname, "..", "..");
const APP = path.join(REPO, "frontend", "app");

const MUTATION_METHOD = /method:\s*["'](POST|PUT|PATCH|DELETE)/;
const SWALLOWED = /\)\s*\.catch\(\s*\(\s*\w*\s*\)\s*=>\s*(?:\{\s*\}|null|undefined|\[\]|\{\})\s*\)/;
/** Closing the window, adding to the list, or navigating away all assert "that worked". */
const SUCCESS_SIGNAL =
  /(alert\(\s*["'`][^"'`]*(?:success|Success|thành công)|setShow\w+\(false\)|set\w+\(\s*(?:prev|\[)|router\.push)/;

/** Automatic side effects, not user assertions. Keep this list short and justified. */
const EXEMPT = new Set(["dashboard/connect/page.tsx:658"]);

function offenders(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === ".next") continue;
        walk(full);
        continue;
      }
      if (!e.name.endsWith(".tsx")) continue;
      const src = fs.readFileSync(full, "utf8");
      let idx = src.indexOf("apiFetch(");
      while (idx !== -1) {
        const next = src.indexOf("apiFetch(", idx + 1);
        const call = src.slice(idx, next === -1 ? idx + 1200 : next);
        if (MUTATION_METHOD.test(call)) {
          const sw = call.match(SWALLOWED);
          if (sw && sw.index !== undefined) {
            const after = call.slice(sw.index + sw[0].length, sw.index + sw[0].length + 400);
            if (SUCCESS_SIGNAL.test(after)) {
              const line = src.slice(0, idx).split("\n").length;
              const where = `${path.relative(APP, full)}:${line}`;
              if (!EXEMPT.has(where)) {
                found.push(`${where} (${call.match(MUTATION_METHOD)![1]})`);
              }
            }
          }
        }
        idx = next;
      }
    }
  };
  walk(APP);
  return found.sort();
}

describe("mutations do not fake success", () => {
  it("no write swallows its failure and then signals that it worked", () => {
    const bad = offenders();
    expect(
      bad,
      bad.length
        ? `These discard the failure of a write and then report success anyway, so a save that ` +
          `did not happen is indistinguishable from one that did:\n  ${bad.join("\n  ")}`
        : ""
    ).toEqual([]);
  });
});
