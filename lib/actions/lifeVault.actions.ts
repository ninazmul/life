"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeVaultItem from "@/lib/database/models/lifeVaultItem.model";
import LifeSettings from "@/lib/database/models/lifeSettings.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { encryptVaultSecret, decryptVaultSecret } from "@/lib/life/crypto";
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

  // Check Master PIN verification if configured
  const settings = (await LifeSettings.findOne().lean()) as { vaultPinHash?: string } | null;
  if (settings?.vaultPinHash && settings.vaultPinHash.trim() !== "") {
    if (!verificationCode || verificationCode.trim() !== settings.vaultPinHash.trim()) {
      throw new Error("Invalid Security PIN. Access denied.");
    }
  }

  const vaultDoc = (await LifeVaultItem.findById(id).lean()) as (ILifeVaultItem & { _id: unknown }) | null;
  if (!vaultDoc) throw new Error("Vault item not found.");

  // Decrypt secret
  const decrypted = decryptVaultSecret(
    vaultDoc.encryptedSecret,
    vaultDoc.secretIv,
    vaultDoc.secretAuthTag
  );

  // Critical Audit Log
  await logLifeActivity({
    action: "VAULT_REVEAL",
    resourceType: "vault",
    resourceId: id,
    resourceName: vaultDoc.title,
    details: `Decrypted and revealed secret for "${vaultDoc.title}" (${vaultDoc.systemOrWebsite || vaultDoc.category})`,
  });

  return { secret: decrypted };
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
