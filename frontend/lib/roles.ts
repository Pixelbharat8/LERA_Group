/**
 * Role Hierarchy for LERA Academy
 * 
 * Chairman is GOD - can access EVERYTHING
 * Role levels: Chairman(0) > CEO(1) > Director(2) > SuperAdmin(3) > CenterAdmin(4) > Teacher/Staff(5) > Parent(6) > Student(7)
 */

export const ROLE_HIERARCHY: Record<string, number> = {
  chairman: 0,
  ceo: 1,
  director: 2,
  superadmin: 3,
  super_admin: 3,
  admin: 3,
  center_admin: 4,
  centeradmin: 4,
  centermanager: 4,
  center_manager: 4,
  academicmanager: 4,
  academic_manager: 4,
  teacher: 5,
  staff: 5,
  ta: 5,
  parent: 6,
  student: 7,
};

/**
 * Get the role level (lower number = higher authority)
 */
export function getRoleLevel(role: string | undefined | null): number {
  if (!role) return 999; // No role = lowest access
  const normalized = role.toLowerCase().replace(/[^a-z_]/g, "");
  return ROLE_HIERARCHY[normalized] ?? 999;
}

/**
 * Check if a user has at least the required role level
 * Chairman (level 0) can access everything
 */
export function hasMinimumRole(userRole: string | undefined | null, requiredRole: string): boolean {
  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRoleLevel(requiredRole);
  return userLevel <= requiredLevel;
}

/**
 * Check if user is Chairman (GOD mode)
 */
export function isChairman(role: string | undefined | null): boolean {
  return role?.toLowerCase() === "chairman";
}

/**
 * Check if user is in executive team (Chairman, CEO, Director)
 */
export function isExecutive(role: string | undefined | null): boolean {
  const level = getRoleLevel(role);
  return level <= 2; // Chairman, CEO, Director
}

/**
 * Check if user is admin level (Chairman, CEO, Director, SuperAdmin)
 */
export function isAdmin(role: string | undefined | null): boolean {
  const level = getRoleLevel(role);
  return level <= 3;
}

/**
 * Check if user can access a specific panel
 */
export function canAccessPanel(userRole: string | undefined | null, panelRole: string): boolean {
  // Chairman can access everything
  if (isChairman(userRole)) return true;
  
  // Executives can access admin panels
  if (isExecutive(userRole) && getRoleLevel(panelRole) >= 3) return true;
  
  // Normal check: user must have same or higher role level
  return hasMinimumRole(userRole, panelRole);
}

/**
 * Get list of roles that can access a panel
 */
export function getAccessibleRoles(minRole: string): string[] {
  const minLevel = getRoleLevel(minRole);
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level <= minLevel)
    .map(([role]) => role);
}
