import { describe, it, expect } from "vitest";
import { validateForm, getRequiredFields, getFieldsBySection, type FormFieldConfig } from "./form-config";

const fields: FormFieldConfig[] = [
  { name: "fullName", label: "Full Name", type: "text", required: true, section: "basic" },
  { name: "nickname", label: "Nickname", type: "text", required: false, section: "basic" },
  { name: "age", label: "Age", type: "number", required: false, section: "extra",
    validation: { min: 3, max: 18, message: "Age must be 3–18" } },
  { name: "email", label: "Email", type: "email", required: false, section: "extra",
    validation: { pattern: "^[^@]+@[^@]+$" } },
];

describe("getFieldsBySection / getRequiredFields", () => {
  it("filters by section", () => {
    expect(getFieldsBySection(fields, "basic").map((f) => f.name)).toEqual(["fullName", "nickname"]);
    expect(getFieldsBySection(fields, "extra")).toHaveLength(2);
  });
  it("returns only required fields", () => {
    expect(getRequiredFields(fields).map((f) => f.name)).toEqual(["fullName"]);
  });
});

describe("validateForm", () => {
  it("flags a missing required field", () => {
    const { valid, errors } = validateForm(fields, {});
    expect(valid).toBe(false);
    expect(errors.fullName).toBe("Full Name is required");
  });

  it("passes when required fields are present and validations satisfied", () => {
    const { valid, errors } = validateForm(fields, { fullName: "Anna", age: 10, email: "a@b.com" });
    expect(valid).toBe(true);
    expect(errors).toEqual({});
  });

  it("enforces numeric min/max with the custom message", () => {
    expect(validateForm(fields, { fullName: "A", age: 1 }).errors.age).toBe("Age must be 3–18");
    expect(validateForm(fields, { fullName: "A", age: 99 }).errors.age).toBe("Age must be 3–18");
  });

  it("enforces a regex pattern", () => {
    expect(validateForm(fields, { fullName: "A", email: "not-an-email" }).errors.email).toBe("Invalid format");
    expect(validateForm(fields, { fullName: "A", email: "x@y.z" }).errors.email).toBeUndefined();
  });
});
