/**
 * Two dashboard lists read fields their APIs have never returned, so the columns were
 * permanently blank:
 *
 *  - centermanager/teachers refetched each teacher's user record just to read `fullName`,
 *    but UserDTO's field is `fullname`. Every teacher card fell back to its teacher code.
 *    The teacher record already carries `displayName`, so the extra request was also N+1.
 *  - academicmanager/students filtered, charted and tabulated `student.level`. The Student
 *    entity has no `level`; the school year lives in `grade`, which is what the superadmin
 *    student screens read and write.
 */
import { readFileSync } from "fs";
import { join } from "path";

const repo = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(repo, p), "utf8");

const ACADEMY = "backend/academy_service/src/main/java/com/lera/academy_service";
const teacherEntity = read(`${ACADEMY}/entity/Teacher.java`);
const studentEntity = read(`${ACADEMY}/entity/Student.java`);
const userDto = read(
  "backend/identity_service/src/main/java/com/lera/identity_service/dto/UserDTO.java"
);
const teachersPage = read("frontend/app/dashboard/centermanager/teachers/page.tsx");
const studentsPage = read("frontend/app/dashboard/academicmanager/students/page.tsx");

describe("centre manager teacher list", () => {
  it("names teachers from a field the teacher record actually has", () => {
    expect(teacherEntity).toMatch(/private String displayName;/);
    expect(teachersPage).toMatch(/teacher\.displayName/);
  });

  it("never reads fullName off a user record — the DTO spells it fullname", () => {
    expect(userDto).toMatch(/private String fullname;/);
    expect(userDto).not.toMatch(/private String fullName;/);
    expect(teachersPage).not.toMatch(/user\.fullName/);
  });
});

describe("academic manager student list", () => {
  it("groups by grade, which exists, not level, which does not", () => {
    expect(studentEntity).toMatch(/private String grade;/);
    expect(studentEntity).not.toMatch(/private String level;/);
    expect(studentsPage).toMatch(/s\.grade/);
    expect(studentsPage).not.toMatch(/student\.level|s\.level/);
  });
});
