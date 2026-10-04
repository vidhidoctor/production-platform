import type { PermissionCode } from "@pp/shared";

export interface NavItem {
  to: string;
  label: string;
  /** Shown to users with ANY of these permissions (the page itself checks the exact one). */
  anyOf: PermissionCode[];
  /** Highlight only on this exact path, not on pages below it. */
  end?: boolean;
}

// Order matters: the first item a user may open is their landing page after login.
export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Punching",
    items: [{ to: "/punching", label: "Punching Master", anyOf: ["PUNCHING_VIEW"] }],
  },
  {
    group: "Production",
    items: [
      { to: "/production", label: "Design search", anyOf: ["PRODUCTION_VIEW"], end: true },
      { to: "/production/orders", label: "All orders", anyOf: ["PRODUCTION_VIEW"] },
    ],
  },
  {
    group: "Material & purchase",
    items: [
      // Hidden from the sidebar for now; the page and its route still exist. Uncomment to bring it back.
      // { to: "/materials/requirements", label: "Material requirement", anyOf: ["MATERIAL_REQUIREMENT_VIEW"] },
      { to: "/materials/purchase", label: "Purchase requirement", anyOf: ["PURCHASE_REQUIREMENT_VIEW"] },
      { to: "/materials/master", label: "Material Master", anyOf: ["MATERIAL_MASTER_VIEW"] },
    ],
  },
  {
    group: "Reports",
    items: [
      {
        to: "/reports",
        label: "Reports",
        anyOf: ["PRODUCTION_REPORT_VIEW", "MATERIAL_REPORT_VIEW", "PURCHASE_REPORT_VIEW"],
      },
    ],
  },
  {
    group: "Admin",
    items: [
      { to: "/admin/users", label: "Users", anyOf: ["USER_VIEW"] },
      { to: "/admin/roles", label: "Roles & permissions", anyOf: ["USER_VIEW"] },
      { to: "/admin/departments", label: "Departments", anyOf: ["USER_VIEW"] },
    ],
  },
];

/** The nav, filtered to what the user may open. */
export function visibleNav(permissions: PermissionCode[]) {
  return NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.anyOf.some((p) => permissions.includes(p))) })).filter(
    (g) => g.items.length > 0,
  );
}
