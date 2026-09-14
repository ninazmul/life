"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/database";
import LifeVaultItem from "@/lib/database/models/lifeVaultItem.model";
import LifeSettings from "@/lib/database/models/lifeSettings.model";
import LifeEmergencyAccess from "@/lib/database/models/lifeEmergencyAccess.model";
import LifeEmergencyRecoveryEvent from "@/lib/database/models/lifeEmergencyRecoveryEvent.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { encryptVaultSecret, decryptVaultSecret, verifyPin } from "@/lib/life/crypto";
import { notifyVaultLockTriggered } from "@/lib/life/notifications";
import { ILifeVaultItem, VaultCategory } from "@/types";

export interface VaultListItem {
  _id: string;
  title: string;
  systemOrWebsite?: string;
  url?: string;
  username?: string;
  recoveryInfo?: string;
  category: VaultCategory;
  notes?: string;
  lastUpdated: Date | string;
  createdAt: Date | string;
}

export async function getVaultItems(params?: {
  category?: VaultCategory;
}): Promise<VaultListItem[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  // Non-owner / unauthorized users cannot list vault secrets
  if (!auth.isOwner && !auth.isAdmin && !auth.permissions.canRevealVault) {
    return [];
  }

  const query: Record<string, unknown> = {};
  if (params?.category) query.category = params.category;

  // Mask encryptedSecret, secretIv, secretAuthTag from client listing
  const items = await LifeVaultItem.find(query)
    .select("-encryptedSecret -secretIv -secretAuthTag")
    .sort({ category: 1, title: 1 })
    .lean();

  return JSON.parse(JSON.stringify(items));
}

export async function createVaultItem(data: {
  title: string;
  systemOrWebsite?: string;
  url?: string;
  username?: string;
  secret: string;
  recoveryInfo?: string;
  category: VaultCategory;
  notes?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can store credentials in the Secure Vault.");
  }

  if (!data.secret) {
    throw new Error("Secret or password is required.");
  }

  // Encrypt with AES-256-GCM at rest
  const { encryptedSecret, secretIv, secretAuthTag } = encryptVaultSecret(data.secret);

  const vaultItem = await LifeVaultItem.create({
    title: data.title,
    systemOrWebsite: data.systemOrWebsite || "",
    url: data.url || "",
    username: data.username || "",
    encryptedSecret,
    secretIv,
    secretAuthTag,
    recoveryInfo: data.recoveryInfo || "",
    category: data.category || "website",
    notes: data.notes || "",
    lastUpdated: new Date(),
  });

  await logLifeActivity({
    action: "CREATE_VAULT_ITEM",
    resourceType: "vault",
    resourceId: String(vaultItem._id),
    resourceName: vaultItem.title,
    details: `Added new vault credentials: "${vaultItem.title}" [${vaultItem.category}]`,
  });

  revalidatePath("/vault");
  revalidatePath("/");
  return { success: true, id: String(vaultItem._id) };
}

export async function updateVaultItem(
  id: string,
  data: {
    title?: string;
    systemOrWebsite?: string;
    url?: string;
    username?: string;
    secret?: string;
    recoveryInfo?: string;
    category?: VaultCategory;
    notes?: string;
  }
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can edit credentials in the Secure Vault.");
  }

  const updateFields: Record<string, unknown> = {
    lastUpdated: new Date(),
  };

  if (data.title !== undefined) updateFields.title = data.title;
  if (data.systemOrWebsite !== undefined) updateFields.systemOrWebsite = data.systemOrWebsite;
  if (data.url !== undefined) updateFields.url = data.url;
  if (data.username !== undefined) updateFields.username = data.username;
  if (data.recoveryInfo !== undefined) updateFields.recoveryInfo = data.recoveryInfo;
  if (data.category !== undefined) updateFields.category = data.category;
  if (data.notes !== undefined) updateFields.notes = data.notes;

  if (data.secret && data.secret.trim() !== "") {
    const { encryptedSecret, secretIv, secretAuthTag } = encryptVaultSecret(data.secret);
    updateFields.encryptedSecret = encryptedSecret;
    updateFields.secretIv = secretIv;
    updateFields.secretAuthTag = secretAuthTag;
  }

  const updated = (await LifeVaultItem.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true }
  ).lean()) as (ILifeVaultItem & { _id: unknown }) | null;

  if (!updated) throw new Error("Vault item not found.");

  await logLifeActivity({
    action: "VAULT_EDIT",
    resourceType: "vault",
    resourceId: id,
    resourceName: updated.title,
    details: `Updated credentials for "${updated.title}" [${updated.category}]`,
  });

  revalidatePath("/vault");
  return { success: true };
}

export async function revealVaultSecret(
  id: string,
  verificationCode?: string
): Promise<{ secret: string }> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  if (!auth.isOwner && !auth.isAdmin && !auth.permissions.canRevealVault) {
    throw new Error("Forbidden: You are not authorized to reveal Vault secrets.");
  }

  let emergencyConfig = await LifeEmergencyAccess.findOne();
  if (emergencyConfig?.isVaultLocked) {
    throw new Error(
      "Master Vault is temporarily LOCKED due to 15 consecutive failed authentication attempts. Emergency Recovery protocol is pending (48-hour window)."
    );
  }

  const vaultDoc = (await LifeVaultItem.findById(id).lean()) as (ILifeVaultItem & { _id: unknown }) | null;
  if (!vaultDoc) throw new Error("Vault item not found.");

  // Check Master PIN verification if configured
  const settings = (await LifeSettings.findOne().lean()) as { vaultPinHash?: string } | null;
  if (settings?.vaultPinHash && settings.vaultPinHash.trim() !== "") {
    if (!verificationCode || !verifyPin(verificationCode, settings.vaultPinHash)) {
      const currentFailures = (emergencyConfig?.consecutiveVaultFailures || 0) + 1;
      await LifeEmergencyAccess.findOneAndUpdate({}, { consecutiveVaultFailures: currentFailures });

      // After 15 consecutive incorrect attempts:
      // 1. Trigger Emergency Recovery process
      // 2. Temporarily lock affected Vault authentication path
      // 3. Create Emergency Recovery Event
      // 4. Notify configured Super Admin/Owner accounts by Email
      // 5. Start 48-hour cancellation period
      // 6. Record event in Audit Log
      if (currentFailures >= 15) {
        const now = new Date();
        const countdownEndsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        let userAgent = "Unknown Browser";
        let ip = "127.0.0.1";
        try {
          const headersList = await headers();
          userAgent = headersList.get("user-agent") || "Browser";
          ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
        } catch {}

        const recoveryEvent = await LifeEmergencyRecoveryEvent.create({
          eventType: "vault_failed_attempts",
          status: "VAULT_LOCKED_PENDING",
          triggeredBy: {
            personId: auth.personId || undefined,
            name: auth.name || "User",
            email: auth.email,
            role: auth.role || "user",
          },
          triggeredAt: now,
          reason: "15 consecutive incorrect Master Vault PIN attempts detected",
          deviceInfo: { userAgent, ip },
          countdownEndsAt,
          simulationFastForwardHours: 0,
          vaultFailureMetadata: {
            consecutiveFailures: currentFailures,
            lockedAt: now,
            targetVaultItemTitle: vaultDoc.title,
          },
        });

        await LifeEmergencyAccess.findOneAndUpdate(
          {},
          {
            isVaultLocked: true,
            vaultLockedAt: now,
            vaultRecoveryState: "VAULT_LOCKED_PENDING",
            activeRecoveryEventId: recoveryEvent._id,
          }
        );

        await notifyVaultLockTriggered({
          eventId: String(recoveryEvent._id),
          eventType: "vault_failed_attempts",
          triggeredByName: auth.name || "User",
          triggeredByEmail: auth.email,
          triggeredAt: now,
          countdownEndsAt,
          hoursRemaining: 48,
          vaultConsecutiveFailures: currentFailures,
          deviceInfo: { userAgent, ip },
        });

        await logLifeActivity({
          action: "VAULT_LOCK_TRIGGERED",
          resourceType: "vault",
          resourceId: id,
          resourceName: vaultDoc.title,
          details: `15 consecutive failed Master Vault attempts. Vault locked. 48-Hour recovery countdown initiated.`,
          isCritical: true,
          metadata: { ip, userAgent },
        });

        revalidatePath("/vault");
        revalidatePath("/access");
        throw new Error(
          "Master Vault has been locked due to 15 consecutive failed attempts. Emergency recovery protocol initiated with a 48-hour notification window."
        );
      }

      await logLifeActivity({
        action: "VAULT_FAILED_ATTEMPT",
        resourceType: "vault",
        resourceId: id,
        resourceName: vaultDoc.title,
        details: `Incorrect PIN verification attempt (${currentFailures}/15) for vault item by ${auth.email}.`,
        isCritical: true,
      });

      throw new Error(`Invalid Security PIN. Attempt ${currentFailures} of 15.`);
    }

    // On successful PIN verification: Reset failure counter
    if (emergencyConfig?.consecutiveVaultFailures && emergencyConfig.consecutiveVaultFailures > 0) {
      await LifeEmergencyAccess.findOneAndUpdate({}, { consecutiveVaultFailures: 0 });
    }
  }

  // Decrypt secret
  const decrypted = decryptVaultSecret(
    vaultDoc.encryptedSecret,
    vaultDoc.secretIv,
    vaultDoc.secretAuthTag
  );

  // Critical Audit Log (action logged with ZERO plaintext secret content)
  await logLifeActivity({
    action: "VAULT_REVEAL",
    resourceType: "vault",
    resourceId: id,
    resourceName: vaultDoc.title,
    details: `Decrypted and revealed secret for "${vaultDoc.title}" (${vaultDoc.systemOrWebsite || vaultDoc.category})`,
  });

  return { secret: decrypted };
}

export async function logVaultCopy(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const vaultDoc = (await LifeVaultItem.findById(id).lean()) as (ILifeVaultItem & { _id: unknown }) | null;
  if (!vaultDoc) return { success: false };

  await logLifeActivity({
    action: "VAULT_COPY",
    resourceType: "vault",
    resourceId: id,
    resourceName: vaultDoc.title,
    details: `Copied secret credentials for "${vaultDoc.title}"`,
  });

  return { success: true };
}

export async function deleteVaultItem(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden");
  }

  const deleted = (await LifeVaultItem.findByIdAndDelete(id).lean()) as (VaultListItem & { _id: unknown }) | null;
  if (deleted) {
    await logLifeActivity({
      action: "DELETE_VAULT_ITEM",
      resourceType: "vault",
      resourceId: id,
      resourceName: deleted.title,
      details: `Deleted vault item: "${deleted.title}"`,
    });
  }

  revalidatePath("/vault");
  revalidatePath("/");
  return { success: true };
}
