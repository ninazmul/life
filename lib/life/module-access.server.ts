import { redirect } from "next/navigation";
import { getLifeAuthContext } from "@/lib/life/auth";
import { canAccessModule } from "@/lib/life/module-access";

/**
 * Server-side guard for module pages.
 * If user is not authenticated, redirects to /sign-in.
 * If user does not have permission for the specified module path, redirects to /.
 * Super Admin and Owner have access to all modules.
 */
export async function requireModuleAccess(modulePath: string) {
  const authContext = await getLifeAuthContext();
  if (!authContext) {
    redirect("/sign-in");
  }

  const isSuperUser =
    authContext.isOwner ||
    authContext.isAdmin ||
    authContext.role === "super_admin" ||
    authContext.role === "owner";
  const hasAccess = canAccessModule(modulePath, authContext.permissions, isSuperUser);

  if (!hasAccess) {
    redirect("/");
  }

  return authContext;
}
