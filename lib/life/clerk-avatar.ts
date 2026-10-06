import { clerkClient } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import LifePerson from "@/lib/database/models/lifePerson.model";

interface ClerkUserSummary {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
}

interface ClerkAvatarMap {
  byEmail: Map<string, string>;
  byId: Map<string, string>;
  users: ClerkUserSummary[];
}

let cachedMap: ClerkAvatarMap | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Retrieves all Clerk user avatars mapped by lowercase email and user ID.
 * Uses an in-memory TTL cache to minimize Clerk API roundtrips.
 */
export async function getClerkAvatarMap(): Promise<ClerkAvatarMap> {
  const now = Date.now();
  if (cachedMap && now < cacheExpiry) {
    return cachedMap;
  }

  try {
    const client = await clerkClient();
    const response = await client.users.getUserList({ limit: 500 });
    const clerkUsers = response.data || [];

    const byEmail = new Map<string, string>();
    const byId = new Map<string, string>();
    const users: ClerkUserSummary[] = [];

    for (const u of clerkUsers) {
      const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "User";
      const primaryEmail =
        u.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || "";
      const imageUrl = u.imageUrl || "";

      if (imageUrl) {
        if (u.id) byId.set(u.id, imageUrl);

        for (const emailObj of u.emailAddresses || []) {
          const email = emailObj.emailAddress?.toLowerCase().trim();
          if (email) {
            byEmail.set(email, imageUrl);
          }
        }
      }

      if (primaryEmail) {
        users.push({
          id: u.id,
          name,
          email: primaryEmail,
          imageUrl,
        });
      }
    }

    cachedMap = { byEmail, byId, users };
    cacheExpiry = now + CACHE_TTL_MS;
    return cachedMap;
  } catch (err) {
    console.error("Failed to fetch Clerk users for avatar resolution:", err);
    return (
      cachedMap || {
        byEmail: new Map(),
        byId: new Map(),
        users: [],
      }
    );
  }
}

/**
 * Resolves the Clerk avatar URL for a given email or clerkUserId.
 */
export async function getClerkAvatar(params: {
  email?: string;
  clerkUserId?: string;
}): Promise<string | undefined> {
  const { byEmail, byId } = await getClerkAvatarMap();

  if (params.clerkUserId && byId.has(params.clerkUserId)) {
    return byId.get(params.clerkUserId);
  }

  if (params.email) {
    const cleanEmail = params.email.toLowerCase().trim();
    if (byEmail.has(cleanEmail)) {
      return byEmail.get(cleanEmail);
    }
  }

  return undefined;
}

/**
 * Augments an array of people records with their real Clerk user avatars by matching email or clerkUserId.
 */
export async function enrichWithClerkAvatars<T extends Record<string, any>>(
  items: T[]
): Promise<T[]> {
  if (!items || items.length === 0) return items;

  try {
    const { byEmail, byId } = await getClerkAvatarMap();

    return items.map((item) => {
      let clerkAvatar: string | undefined;

      if (item.clerkUserId && byId.has(item.clerkUserId)) {
        clerkAvatar = byId.get(item.clerkUserId);
      } else if (item.email) {
        const cleanEmail = item.email.toLowerCase().trim();
        if (byEmail.has(cleanEmail)) {
          clerkAvatar = byEmail.get(cleanEmail);
        }
      }

      if (clerkAvatar) {
        return {
          ...item,
          avatarUrl: clerkAvatar,
          profilePhoto: clerkAvatar,
        };
      }

      return item;
    });
  } catch (e) {
    console.error("enrichWithClerkAvatars error:", e);
    return items;
  }
}

/**
 * Automatically syncs users from Clerk into the LifePerson directory.
 * - If a person with matching email exists, ensures their clerkUserId and avatarUrl/profilePhoto match Clerk.
 * - If a Clerk user does not exist in LifePerson yet, creates a basic LifePerson record with their Clerk avatar.
 */
export async function syncClerkUsersWithPeople(): Promise<void> {
  try {
    await connectToDatabase();
    const { users } = await getClerkAvatarMap();

    for (const u of users) {
      if (!u.email) continue;
      const cleanEmail = u.email.toLowerCase().trim();

      const existing = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${cleanEmail}$`, "i") },
          { clerkUserId: u.id },
        ],
      });

      if (existing) {
        const updates: Record<string, unknown> = {};
        if (u.imageUrl && existing.avatarUrl !== u.imageUrl) {
          updates.avatarUrl = u.imageUrl;
          updates.profilePhoto = u.imageUrl;
        }
        if (!existing.clerkUserId && u.id) {
          updates.clerkUserId = u.id;
        }
        if (Object.keys(updates).length > 0) {
          await LifePerson.updateOne({ _id: existing._id }, { $set: updates });
        }
      } else {
        // Create new person record from Clerk account
        await LifePerson.create({
          name: u.name || cleanEmail.split("@")[0],
          relation: "Member",
          email: cleanEmail,
          clerkUserId: u.id,
          avatarUrl: u.imageUrl,
          profilePhoto: u.imageUrl,
          status: "active",
          accountStatus: "active",
          role: "individual",
          userRole: "individual",
          isLoginEnabled: true,
          permissions: {
            canViewPersonal: true,
            canViewBusiness: false,
            canViewFinancial: false,
            canViewSensitive: false,
            canRevealVault: false,
            canManageAccess: false,
            canAccessEmergency: false,
          },
        }).catch((err) => {
          console.error(`Failed to create LifePerson for ${cleanEmail}:`, err);
        });
      }
    }
  } catch (err) {
    console.error("syncClerkUsersWithPeople error:", err);
  }
}
