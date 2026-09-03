import {
  AdminRole,
  AppModule,
  ModulePermissions,
  PermissionLevel,
} from "@/types";

export const ALL_APP_MODULES: AppModule[] = [
  "life",
  "people",
  "information",
  "business",
  "money",
  "assets",
  "contacts",
  "documents",
  "vault",
  "legacy",
  "access",
  "activity",
  "settings",
];

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, ModulePermissions> = {
  super_admin: {
    life: "write",
    people: "write",
    information: "write",
    business: "write",
    money: "write",
    assets: "write",
    contacts: "write",
    documents: "write",
    vault: "write",
    legacy: "write",
    access: "write",
    activity: "write",
    settings: "write",
  },
  admin: {
    life: "write",
    people: "write",
    information: "write",
    business: "write",
    money: "write",
    assets: "write",
    contacts: "write",
    documents: "write",
    vault: "read",
    legacy: "read",
    access: "read",
    activity: "read",
    settings: "read",
  },
  editor: {
    life: "read",
    people: "read",
    information: "write",
    business: "read",
    money: "read",
    assets: "read",
    contacts: "write",
    documents: "write",
    vault: "none",
    legacy: "none",
    access: "none",
    activity: "none",
    settings: "none",
  },
  moderator: {
    life: "read",
    people: "read",
    information: "read",
    business: "read",
    money: "none",
    assets: "none",
    contacts: "read",
    documents: "read",
    vault: "none",
    legacy: "none",
    access: "none",
    activity: "none",
    settings: "none",
  },
  viewer: {
    life: "read",
    people: "read",
    information: "read",
    business: "read",
    money: "read",
    assets: "read",
    contacts: "read",
    documents: "read",
    vault: "none",
    legacy: "none",
    access: "none",
    activity: "none",
    settings: "none",
  },
  custom: {
    life: "read",
    people: "none",
    information: "none",
    business: "none",
    money: "none",
    assets: "none",
    contacts: "none",
    documents: "none",
    vault: "none",
    legacy: "none",
    access: "none",
    activity: "none",
    settings: "none",
  },
};

/**
 * Resolves full effective permissions for a user given their role and custom overrides.
 */
export function resolveEffectivePermissions(
  role: AdminRole,
  customPerms?: Partial<ModulePermissions> | Map<string, string>
): ModulePermissions {
  if (role === "super_admin") {
    return { ...DEFAULT_ROLE_PERMISSIONS.super_admin };
  }

  const base = { ...(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.custom) };

  if (role === "custom" && customPerms) {
    let customObj: Record<string, string> = {};
    if (customPerms instanceof Map) {
      customPerms.forEach((val, key) => {
        customObj[key] = val;
      });
    } else {
      customObj = customPerms as Record<string, string>;
    }

    for (const mod of ALL_APP_MODULES) {
      const val = customObj[mod] as PermissionLevel | undefined;
      if (val && ["none", "read", "write"].includes(val)) {
        base[mod] = val;
      }
    }
  }

  return base;
}

/**
 * Checks if a user has sufficient permission level for a module.
 */
export function hasPermissionLevel(
  effectivePerms: ModulePermissions,
  module: AppModule,
  requiredLevel: PermissionLevel
): boolean {
  const current = effectivePerms[module] || "none";
  if (requiredLevel === "none") return true;
  if (requiredLevel === "read") return current === "read" || current === "write";
  if (requiredLevel === "write") return current === "write";
  return false;
}
