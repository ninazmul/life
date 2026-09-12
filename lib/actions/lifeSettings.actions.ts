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
import LifeFinancialSupport from "@/lib/database/models/lifeFinancialSupport.model";
import LifeInstallment from "@/lib/database/models/lifeInstallment.model";
import LifePaymentConfirmation from "@/lib/database/models/lifePaymentConfirmation.model";
import LifeFinancialHistory from "@/lib/database/models/lifeFinancialHistory.model";
import LifeGuardian from "@/lib/database/models/lifeGuardian.model";
import LifeEmergencyAccess from "@/lib/database/models/lifeEmergencyAccess.model";
import LifeEmergencyRequest from "@/lib/database/models/lifeEmergencyRequest.model";
import LifeInstruction from "@/lib/database/models/lifeInstruction.model";
import LifeResponsibility from "@/lib/database/models/lifeResponsibility.model";
import LifeActivityLog from "@/lib/database/models/lifeActivityLog.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { hashPin } from "@/lib/life/crypto";

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

  const hashed = hashPin(pin.trim());

  await LifeSettings.findOneAndUpdate(
    {},
    { $set: { vaultPinHash: hashed, ownerEmail: auth.email } },
    { upsert: true }
  );

  await logLifeActivity({
    action: "UPDATE_VAULT_PIN",
    resourceType: "settings",
    resourceName: "Security PIN",
    details: `Updated Master Security PIN (salted hash) by ${auth.email}`,
  });

  revalidatePath("/settings");
  revalidatePath("/vault");
  return { success: true };
}

export async function exportLifeBackup() {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Administrators can export complete database backups.");
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
    financialSupports,
    installments,
    paymentConfirmations,
    financialHistories,
    guardians,
    emergencyAccess,
    emergencyRequests,
    instructions,
    responsibilities,
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
    LifeVaultItem.find().lean(),
    LifeLegacyMessage.find().lean(),
    LifeFinancialSupport.find().lean(),
    LifeInstallment.find().lean(),
    LifePaymentConfirmation.find().lean(),
    LifeFinancialHistory.find().lean(),
    LifeGuardian.find().lean(),
    LifeEmergencyAccess.find().lean(),
    LifeEmergencyRequest.find().lean(),
    LifeInstruction.find().lean(),
    LifeResponsibility.find().lean(),
  ]);

  const backupPayload = {
    appName: "LIFE_VAULT",
    version: "2.0",
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
      financialSupports,
      installments,
      paymentConfirmations,
      financialHistories,
      guardians,
      emergencyAccess,
      emergencyRequests,
      instructions,
      responsibilities,
    },
  };

  await logLifeActivity({
    action: "BACKUP_EXPORTED",
    resourceType: "settings",
    resourceName: "Life Database Backup",
    details: `Exported complete encrypted Life backup archive (all modules) by ${auth.email}`,
  });

  return JSON.stringify(backupPayload, null, 2);
}

export async function restoreLifeBackup(jsonString: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || !auth.isOwner) {
    throw new Error("Forbidden: Only the Owner can perform a full database restore.");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid backup file: Not valid JSON.");
  }

  if (!parsed.data || typeof parsed.data !== "object") {
    throw new Error("Invalid backup structure: Missing 'data' object.");
  }

  const data = parsed.data;

  // Restore collections
  if (Array.isArray(data.people) && data.people.length > 0) {
    for (const item of data.people) {
      await LifePerson.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.financialSupports) && data.financialSupports.length > 0) {
    for (const item of data.financialSupports) {
      await LifeFinancialSupport.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.installments) && data.installments.length > 0) {
    for (const item of data.installments) {
      await LifeInstallment.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.paymentConfirmations) && data.paymentConfirmations.length > 0) {
    for (const item of data.paymentConfirmations) {
      await LifePaymentConfirmation.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.financialHistories) && data.financialHistories.length > 0) {
    for (const item of data.financialHistories) {
      await LifeFinancialHistory.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.vaultItems) && data.vaultItems.length > 0) {
    for (const item of data.vaultItems) {
      await LifeVaultItem.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.documents) && data.documents.length > 0) {
    for (const item of data.documents) {
      await LifeDocument.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.legacyMessages) && data.legacyMessages.length > 0) {
    for (const item of data.legacyMessages) {
      await LifeLegacyMessage.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.businesses) && data.businesses.length > 0) {
    for (const item of data.businesses) {
      await LifeBusiness.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.assets) && data.assets.length > 0) {
    for (const item of data.assets) {
      await LifeAsset.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.contacts) && data.contacts.length > 0) {
    for (const item of data.contacts) {
      await LifeContact.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.information) && data.information.length > 0) {
    for (const item of data.information) {
      await LifeInformation.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.instructions) && data.instructions.length > 0) {
    for (const item of data.instructions) {
      await LifeInstruction.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.responsibilities) && data.responsibilities.length > 0) {
    for (const item of data.responsibilities) {
      await LifeResponsibility.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  if (Array.isArray(data.guardians) && data.guardians.length > 0) {
    for (const item of data.guardians) {
      await LifeGuardian.findByIdAndUpdate(item._id, item, { upsert: true });
    }
  }

  await logLifeActivity({
    action: "BACKUP_RESTORED",
    resourceType: "settings",
    resourceName: "Life Database Backup",
    details: `Restored database from backup version ${parsed.version || "1.0"} exported at ${parsed.exportedAt || "unknown"}`,
    isCritical: true,
  });

  revalidatePath("/");
  return { success: true };
}
