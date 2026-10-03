/**
 * The per-user feature switches the Chairman controls, in one place.
 *
 * Each entry is a column of identity_service's `user_permissions`. `field` is the name the
 * API returns (UserPermissionDTO); `putKey` is the name PUT /api/user-permissions/user/{id}
 * reads — they differ only for the AI Assistant. `feature-registry.test.ts` fails if this
 * list and the DTO drift apart.
 */
export type FeatureKind = "module" | "service";

export interface FeatureDef {
  field: string;
  putKey: string;
  label: string;
  kind: FeatureKind;
}

export const FEATURES: readonly FeatureDef[] = [
  { field: "dashboard", putKey: "dashboard", label: "Dashboard (menu only)", kind: "module" },
  { field: "centers", putKey: "centers", label: "Centers", kind: "module" },
  { field: "users", putKey: "users", label: "Users & Roles", kind: "module" },
  { field: "students", putKey: "students", label: "Students", kind: "module" },
  { field: "teachers", putKey: "teachers", label: "Teachers", kind: "module" },
  { field: "classes", putKey: "classes", label: "Classes", kind: "module" },
  { field: "courses", putKey: "courses", label: "Courses", kind: "module" },
  { field: "attendance", putKey: "attendance", label: "Attendance", kind: "module" },
  { field: "payments", putKey: "payments", label: "Payments / Finance", kind: "module" },
  { field: "payroll", putKey: "payroll", label: "Payroll", kind: "module" },
  { field: "reports", putKey: "reports", label: "Reports", kind: "module" },
  { field: "settings", putKey: "settings", label: "Settings", kind: "module" },
  { field: "aiAssistant", putKey: "ai_assistant", label: "AI Assistant", kind: "module" },
  { field: "communication", putKey: "communication", label: "Communication", kind: "module" },
  { field: "documents", putKey: "documents", label: "Documents", kind: "module" },
  { field: "socialMedia", putKey: "socialMedia", label: "Social Media (Facebook)", kind: "module" },
  { field: "academyServiceEnabled", putKey: "academyServiceEnabled", label: "Academy Service", kind: "service" },
  { field: "paymentServiceEnabled", putKey: "paymentServiceEnabled", label: "Payment Service", kind: "service" },
  { field: "attendanceServiceEnabled", putKey: "attendanceServiceEnabled", label: "Attendance Service", kind: "service" },
  { field: "payrollServiceEnabled", putKey: "payrollServiceEnabled", label: "Payroll Service", kind: "service" },
  { field: "connectServiceEnabled", putKey: "connectServiceEnabled", label: "Connect Service", kind: "service" },
  { field: "aiGatewayEnabled", putKey: "aiGatewayEnabled", label: "AI Gateway", kind: "service" },
];

const PUT_KEYS = new Set(FEATURES.map((f) => f.putKey));

/**
 * A PUT body carrying only the switches present in `perms`, keyed as PUT expects.
 *
 * PUT leaves every column it is not sent untouched, so an editor that shows a subset of the
 * switches must send only that subset. The Roles screens used to POST (a full replace) and
 * so reset Social Media and all six service switches on every save.
 */
export const partialPermissionBody = (perms: object): Record<string, boolean> => {
  const body: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(perms)) {
    if (PUT_KEYS.has(key)) body[key] = Boolean(value);
  }
  return body;
};
