import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * The public site's About page renders its leadership team from
 * /api/leadership-members/public, backed by the `leadership_team` table.
 *
 * Its editor wrote to /api/team-members — the SPORTS TEAM ROSTER (team_id, student_id,
 * jersey_number, position, goals_scored, assists). Three consequences, any one fatal:
 *   - team_id and student_id are NOT NULL, so adding a leader was rejected outright;
 *   - the editor's list rendered sports roster rows, which carry no name/role/bio, as blanks;
 *   - even had a row saved, the public About page would never have shown it, because it reads
 *     a different table entirely.
 */

const REPO = path.resolve(__dirname, "..", "..");
const read = (p: string) => fs.readFileSync(path.join(REPO, p), "utf8");
const code = (p: string) =>
  read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const ACADEMY = "backend/academy_service/src/main/java/com/lera/academy_service";
const leadership = read(`${ACADEMY}/entity/LeadershipMember.java`);
const roster = read(`${ACADEMY}/entity/TeamMember.java`);
const editor = code("frontend/app/dashboard/superadmin/public-website/about/page.tsx");
const publicAbout = read("frontend/app/about/page.tsx");

describe("the two 'team' entities are not interchangeable", () => {
  it("leadership_team holds name/role/bio", () => {
    expect(leadership).toMatch(/@Table\(name = "leadership_team"\)/);
    expect(leadership).toMatch(/@Column\(name = "name", nullable = false\)/);
    expect(leadership).toMatch(/@Column\(name = "role", nullable = false\)/);
  });

  it("team_members is a sports roster and requires a team and a student", () => {
    expect(roster).toMatch(/@Table\(name = "team_members"/);
    expect(roster).toMatch(/private UUID teamId;/);
    expect(roster).toMatch(/private UUID studentId;/);
    expect(roster).toMatch(/jerseyNumber|goalsScored/);
    expect(roster).not.toMatch(/private String (role|bio);/);
  });
});

describe("the About editor and the public About page use the same source", () => {
  it("the public page reads leadership-members", () => {
    expect(publicAbout).toMatch(/\/api\/leadership-members\/public/);
  });

  it("the editor writes leadership-members, never the sports roster", () => {
    expect(editor).toMatch(/\/api\/leadership-members/);
    expect(editor).not.toMatch(/\/api\/team-members/);
  });
});
