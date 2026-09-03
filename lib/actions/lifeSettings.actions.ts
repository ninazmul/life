"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeSettings from "@/lib/database/models/lifeSettings.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeInformation from "@/lib/database/models/lifeInformation.model";
import LifeBusiness from "@/lib/database/models/lifeBusiness.model";
import LifeMoneyRecord from "@/lib/database/models/lifeMoneyRecord.model";
import LifeSettlement from "@/lib/database/models/lifeSettlement.model";
import LifeTransaction from "@/lib/database/models/lifeTransaction.model";
import LifeAsset from "@/lib/database/models/lifeAsset.model";
import LifeContact from "@/lib/database/models/lifeContact.model";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import LifeVaultItem from "@/lib/database/models/lifeVaultItem.model";
import LifeLegacyMessage from "@/lib/database/models/lifeLegacyMessage.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";

export async function getLifeSettings() {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return null;

  let settings = await LifeSettings.findOne().lean();
  if (!settings) {
    const created = await LifeSettings.create({
      ownerEmail: auth.email,
      currencySymbol: "৳",
      autoConcealVaultSeconds: 30,
      enablePwaInstallBanner: true,
    });
    settings = created.toObject ? created.toObject() : created;
  }

  const s = settings as {
    currencySymbol?: string;
    autoConcealVaultSeconds?: number;
    enablePwaInstallBanner?: boolean;
    vaultPinHash?: string;
    ownerEmail?: string;
  } | null;

  return {
    currencySymbol: s?.currencySymbol || "৳",
    autoConcealVaultSeconds: s?.autoConcealVaultSeconds || 30,
    enablePwaInstallBanner: s?.enablePwaInstallBanner ?? true,
    isPinSet: Boolean(s?.vaultPinHash && s.vaultPinHash.trim().length > 0),
    ownerEmail: s?.ownerEmail,
  };
}

export async function setVaultPin(pin: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners can set or change the Vault Security PIN.");
  }

  if (!pin || pin.trim().length < 4) {
    throw new Error("PIN must be at least 4 characters long.");
  }

  await LifeSettings.findOneAndUpdate(
    {},
    { $set: { vaultPinHash: pin.trim(), ownerEmail: auth.email } },
    { upsert: true }
  );

  await logLifeActivity({
    action: "UPDATE_VAULT_PIN",
    resourceType: "settings",
    resourceName: "Security PIN",
    details: `Updated Master Security PIN for Vault reveal flow by ${auth.email}`,
  });

  revalidatePath("/settings");
  revalidatePath("/vault");
  return { success: true };
}

export async function exportLifeBackup() {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || !auth.isOwner) {
    throw new Error("Forbidden: Only the primary Owner can export complete database backups.");
  }

  const [
    people,
    information,
    businesses,
    moneyRecords,
    settlements,
    transactions,
    assets,
    contacts,
    documents,
    vaultItems,
    legacyMessages,
  ] = await Promise.all([
    LifePerson.find().lean(),
    LifeInformation.find().lean(),
    LifeBusiness.find().lean(),
    LifeMoneyRecord.find().lean(),
    LifeSettlement.find().lean(),
    LifeTransaction.find().lean(),
    LifeAsset.find().lean(),
    LifeContact.find().lean(),
    LifeDocument.find().lean(),
    LifeVaultItem.find().lean(), // remains encrypted with AES-256-GCM
    LifeLegacyMessage.find().lean(),
  ]);

  const backupPayload = {
    appName: "LIFE_ERP",
    version: "1.0",
    exportedAt: new Date().toISOString(),
    exportedBy: auth.email,
    data: {
      people,
      information,
      businesses,
      moneyRecords,
      settlements,
      transactions,
      assets,
      contacts,
      documents,
      vaultItems,
      legacyMessages,
    },
  };

  await logLifeActivity({
    action: "BACKUP_EXPORTED",
    resourceType: "settings",
    resourceName: "Life Database Backup",
    details: `Exported complete encrypted Life backup archive by ${auth.email}`,
  });

  return JSON.stringify(backupPayload, null, 2);
}
