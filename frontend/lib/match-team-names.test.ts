/**
 * A SportMatch row holds homeTeamId / awayTeamId and no names, so the fixtures table rendered
 * two raw UUIDs per row and the search box could never match a team by name. Same shape as the
 * student-points leaderboard: resolve the names server-side, batched, not one query per row.
 */
import { readFileSync } from "fs";
import { join } from "path";

const repo = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(repo, p), "utf8");

const ACADEMY = "backend/academy_service/src/main/java/com/lera/academy_service";
const entity = read(`${ACADEMY}/entity/SportMatch.java`);
const controller = read(`${ACADEMY}/controller/SportMatchController.java`);
const page = read("frontend/app/dashboard/superadmin/sports/page.tsx");

describe("fixtures list", () => {
  it("the match row carries ids, not names", () => {
    expect(entity).toMatch(/private UUID homeTeamId;/);
    expect(entity).not.toMatch(/private String homeTeamName;/);
  });

  it("the endpoint resolves both team names", () => {
    expect(controller).toMatch(/row\.put\("homeTeamName"/);
    expect(controller).toMatch(/row\.put\("awayTeamName"/);
  });

  it("resolves them in one query", () => {
    expect(controller).toMatch(/sportTeamRepository\.findAllById\(teamIds\)/);
  });

  it("the page reads the names the endpoint now returns", () => {
    expect(page).toMatch(/match\.homeTeamName/);
    expect(page).toMatch(/m\.homeTeamName\?\.toLowerCase\(\)/);
  });
});
