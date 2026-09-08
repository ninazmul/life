import { LifePermission } from "@/types";

/**
 * Module Access Control
 *
 * Defines which permission flags grant access to each module.
 * Owner and Super Admin bypass all checks (see all modules).
 * Other users only see modules for which they have at least one required permission.
 */

export type ModulePath =
  | "/"
  | "/people"
  | "/business"
  | "/vault"
  | "/money"
  | "/finance"
  | "/assets"
  | "/instructions"
  | "/contacts"
  | "/documents"
  | "/legacy"
  | "/beneficiaries"
  | "/guardians"
  | "/activity"
  | "/settings"
  | "/access"
  | "/information"
  | "/guide";

/**
 * Maps each module path to a function that checks whether the given
 * permission set grants access to that module.
 *
 * Rules:
 * - "/" (Home) and "/guide" (User Guide) are always accessible.
 * - Admin-only modules (/activity, /settings, /access) require canManageAccess.
 * - Sensitive modules (/vault) require canRevealVault.
 * - Financial modules (/finance, /money, /assets) require canViewFinancial.
 * - Business modules (/business) require canViewBusiness.
 * - People/personal modules require canViewPersonal.
 * - Emergency modules (/guardians) require canAccessEmergency.
 * - Documents/legacy require canViewPersonal OR canViewSensitive.
 * - Beneficiaries require canViewFinancial OR canViewPersonal.
 * - Instructions: visible to anyone assigned (canViewPersonal covers it).
 */
const MODULE_PERMISSION_MAP: Record<string, (p: LifePermission) => boolean> = {
  "/": () => true,
  "/guide": () => true,

  // People & personal
  "/people": (p) => p.canViewPersonal || p.canManageAccess,
  "/information": (p) => p.canViewPersonal,
  "/contacts": (p) => p.canViewPersonal,
  "/instructions": (p) => p.canViewPersonal,

  // Business
  "/business": (p) => p.canViewBusiness,

  // Financial
  "/finance": (p) => p.canViewFinancial,
  "/money": (p) => p.canViewFinancial,
  "/assets": (p) => p.canViewFinancial || p.canViewBusiness,

  // Vault (sensitive credentials)
  "/vault": (p) => p.canRevealVault,

  // Legacy & documents
  "/documents": (p) => p.canViewPersonal || p.canViewSensitive,
  "/legacy": (p) => p.canViewPersonal || p.canViewSensitive,

  // Beneficiaries
  "/beneficiaries": (p) => p.canViewFinancial || p.canViewPersonal,

  // Emergency & guardians
  "/guardians": (p) => p.canAccessEmergency || p.canManageAccess,

  // Admin-only
  "/activity": (p) => p.canManageAccess,
  "/settings": (p) => p.canManageAccess,
  "/access": (p) => p.canManageAccess,
};

/**
 * Check if a user can access a specific module path.
 *
 * @param path - The module route path (e.g. "/business")
 * @param permissions - The user's LifePermission flags
 * @param isOwnerOrAdmin - If true, all modules are accessible
 * @returns true if the user can access the module
 */
export function canAccessModule(
  path: string,
  permissions: LifePermission,
  isOwnerOrAdmin: boolean
): boolean {
  if (isOwnerOrAdmin) return true;

  // Normalize path: strip trailing slash, match base path for dynamic routes
  const basePath = getBasePath(path);
  const checker = MODULE_PERMISSION_MAP[basePath];

  // If no mapping found, default to restricted (deny)
  if (!checker) return false;

  return checker(permissions);
}

/**
 * Extract the base module path from a potentially dynamic route.
 * e.g. "/finance/abc123" → "/finance", "/people/xyz/edit" → "/people"
 */
function getBasePath(path: string): string {
  const normalized = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length === 0) return "/";

  return `/${segments[0]}`;
}

/**
 * Serializable user access info to pass from server to client components.
 */
export interface UserModuleAccess {
  isOwner: boolean;
  isAdmin: boolean;
  permissions: LifePermission;
}
