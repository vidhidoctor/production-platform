// Permission codes and default role mapping. The server seed writes these to the DB
// (after that, Admin can change a role's permissions through the API); the client uses
// the codes to show or hide pages.

export const PERMISSIONS = {
  PUNCHING_VIEW: "View Punching Master / Name + Size consumption",
  PUNCHING_CREATE: "Create Punching Master entries",
  PUNCHING_UPDATE: "Update Punching Master entries",

  PRODUCTION_VIEW: "View production orders and calculations",
  PRODUCTION_CREATE: "Create production orders",
  PRODUCTION_UPDATE: "Update production orders",

  MATERIAL_REQUIREMENT_VIEW: "View total / material-wise requirements",
  MATERIAL_MASTER_VIEW: "View Material Master and conversion rules",
  MATERIAL_MASTER_MANAGE: "Add / edit / remove materials (the consumption columns) and their conversion rules",

  PURCHASE_REQUIREMENT_VIEW: "View purchase requirements (rolls, KG)",

  PRODUCTION_REPORT_VIEW: "View / export production reports",
  MATERIAL_REPORT_VIEW: "View / export material reports",
  PURCHASE_REPORT_VIEW: "View / export purchase reports",

  USER_VIEW: "View users",
  USER_CREATE: "Create users",
  USER_UPDATE: "Edit, activate/deactivate, assign role and department",
  USER_DELETE: "Delete users",

  ROLE_MANAGE: "Create roles",
  PERMISSION_MANAGE: "Change which permissions a role has",
  DEPARTMENT_MANAGE: "Create departments",
} as const;

export type PermissionCode = keyof typeof PERMISSIONS;

const ALL = Object.keys(PERMISSIONS) as PermissionCode[];

export const ROLES: Record<string, PermissionCode[]> = {
  Admin: ALL,
  "Punching Employee": ["PUNCHING_VIEW", "PUNCHING_CREATE", "PUNCHING_UPDATE"],
  "Production Employee": [
    "PRODUCTION_VIEW",
    "PRODUCTION_CREATE",
    "PRODUCTION_UPDATE",
    "MATERIAL_REQUIREMENT_VIEW",
    "PURCHASE_REQUIREMENT_VIEW",
    "PRODUCTION_REPORT_VIEW",
    "MATERIAL_REPORT_VIEW",
    "PURCHASE_REPORT_VIEW",
  ],
};

export const DEPARTMENTS = ["Administration", "Punching", "Production"];
