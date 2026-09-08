"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeShareHistory from "@/lib/database/models/lifeShareHistory.model";
import LifeBusiness from "@/lib/database/models/lifeBusiness.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import { requireOwnerOrAdmin, logLifeActivity } from "@/lib/life/auth";

export async function getShareHistoryForBusiness(businessId: string) {
  try {
    await connectToDatabase();
    const history = await LifeShareHistory.find({ businessId })
      .populate("personId", "name relation phone")
      .sort({ effectiveDate: -1 })
      .lean();

    return JSON.parse(JSON.stringify(history));
  } catch (error: any) {
    console.error("Error in getShareHistoryForBusiness:", error);
    return [];
  }
}

export async function updatePartnerShare({
  businessId,
  personId,
  newShare,
  effectiveDate,
  reason,
  supportingAgreement = "",
  witnessVerifier = "",
}: {
  businessId: string;
  personId: string;
  newShare: number;
  effectiveDate: Date | string;
  reason: string;
  supportingAgreement?: string;
  witnessVerifier?: string;
}) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const business = await LifeBusiness.findById(businessId);
    if (!business) throw new Error("Business not found");

    const person = await LifePerson.findById(personId);
    const personName = person?.name || "Partner";

    const partner = business.partners.find(
      (p: any) => p.personId && String(p.personId) === String(personId)
    );
    const previousShare = partner ? partner.ownershipPercentage : 0;

    // Create immutable share history entry (§18)
    const historyEntry = await LifeShareHistory.create({
      businessId,
      personId,
      personName,
      previousShare,
      newShare: Number(newShare),
      effectiveDate: new Date(effectiveDate),
      reason,
      supportingAgreement,
      approvedBy: context.name,
      witnessVerifier,
      previousVersionSnapshot: JSON.stringify(partner || {}),
    });

    // Update partner share on business
    if (partner) {
      partner.ownershipPercentage = Number(newShare);
    } else {
      business.partners.push({
        name: personName,
        personId,
        ownershipPercentage: Number(newShare),
        role: "Partner",
      });
    }
    await business.save();

    await logLifeActivity({
      action: "UPDATE_PARTNER_SHARE",
      resourceType: "business",
      resourceId: businessId,
      resourceName: business.name,
      details: `Updated share for ${personName} from ${previousShare}% to ${newShare}%. Reason: ${reason}`,
      previousValue: `${previousShare}%`,
      newValue: `${newShare}%`,
      isCritical: true,
    });

    revalidatePath(`/business/${businessId}`);
    return { success: true, historyEntry: JSON.parse(JSON.stringify(historyEntry)) };
  } catch (error: any) {
    console.error("Error in updatePartnerShare:", error);
    return { success: false, error: error.message };
  }
}
