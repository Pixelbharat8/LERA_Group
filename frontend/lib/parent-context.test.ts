import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "./api";
import { loadTeachersForChild } from "./parent-context";

vi.mock("./api", () => ({ apiFetch: vi.fn() }));
const apiFetch = vi.mocked(api.apiFetch);

describe("loadTeachersForChild", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves enrollment → class → teacher → user and de-dupes by teacher userId", async () => {
    // Two classes, both led by the same teacher entity (t1 → user u1): one contact expected.
    apiFetch.mockImplementation((url: string) => {
      if (url.startsWith("/api/enrollments")) return Promise.resolve([{ classId: "cl1" }, { classId: "cl2" }]);
      if (url === "/api/classes/cl1") return Promise.resolve({ name: "A1", teacherId: "t1" });
      if (url === "/api/classes/cl2") return Promise.resolve({ name: "A2", teacherId: "t1" });
      if (url === "/api/teachers/t1") return Promise.resolve({ userId: "u1" });
      if (url === "/api/users/u1")
        return Promise.resolve({ fullname: "Ms. Lan", email: "lan@x.com", phone: "0900" });
      return Promise.resolve(null);
    });

    const contacts = await loadTeachersForChild("s1");
    expect(contacts).toHaveLength(1);
    // The same teacher leads both classes; the map keys by userId, so the last class wins.
    expect(contacts[0]).toMatchObject({ id: "u1", fullname: "Ms. Lan", email: "lan@x.com", className: "A2" });
  });

  it("skips enrollments with no classId and classes with no teacher", async () => {
    apiFetch.mockImplementation((url: string) => {
      if (url.startsWith("/api/enrollments")) return Promise.resolve([{}, { classId: "cl3" }]);
      if (url === "/api/classes/cl3") return Promise.resolve({ name: "B1" }); // no teacherId
      return Promise.resolve(null);
    });
    expect(await loadTeachersForChild("s1")).toEqual([]);
  });

  it("returns [] when enrollments is not an array", async () => {
    apiFetch.mockResolvedValueOnce({ error: "nope" });
    expect(await loadTeachersForChild("s1")).toEqual([]);
  });

  it("derives a display name from email when the user has no name", async () => {
    apiFetch.mockImplementation((url: string) => {
      if (url.startsWith("/api/enrollments")) return Promise.resolve([{ classId: "cl1" }]);
      if (url === "/api/classes/cl1") return Promise.resolve({ name: "A1", teacherId: "t1" });
      if (url === "/api/teachers/t1") return Promise.resolve({ userId: "u1" });
      if (url === "/api/users/u1") return Promise.resolve({ email: "teacher.jo@x.com" });
      return Promise.resolve(null);
    });
    const contacts = await loadTeachersForChild("s1");
    expect(contacts[0].fullname).toBe("teacher.jo");
  });
});
