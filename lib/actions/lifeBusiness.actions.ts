"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeBusiness from "@/lib/database/models/lifeBusiness.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { ILifeBusiness, ILifeContinuityStep } from "@/types";

export async function getBusinesses(): Promise<ILifeBusiness[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const query: Record<string, unknown> = {};

  // If non-admin, check business access
  if (!auth.isOwner && !auth.isAdmin && !auth.permissions.canViewBusiness) {
    return [];
  }

  const businesses = await LifeBusiness.find(query)
    .populate("partners.personId", "name relation phone")
    .populate("engineerContact.personId", "name relation phone")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(businesses));
}

export async function createBusiness(data: {
  name: string;
  legalName?: string;
  ownershipPercentage?: number;
  status?: "active" | "inactive" | "pending";
  partners?: Array<{
    name: string;
    personId?: string;
    ownershipPercentage: number;
    role?: string;
  }>;
  serverInfo?: {
    hosting?: string;
    domain?: string;
    ip?: string;
    serverType?: string;
    dashboardUrl?: string;
    notes?: string;
  };
  engineerContact?: {
    name?: string;
    phone?: string;
    email?: string;
    personId?: string;
  };
  supplierContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  monthlyExpenses?: number;
  outstandingPayments?: number;
  receivables?: number;
  instructions?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can add businesses.");
  }

  // Format partners
  const formattedPartners = (data.partners || []).map((p) => ({
    name: p.name,
    personId: p.personId && p.personId !== "none" ? p.personId : undefined,
    ownershipPercentage: Number(p.ownershipPercentage) || 0,
    role: p.role || "",
  }));

  const engineerClean = data.engineerContact
    ? {
        ...data.engineerContact,
        personId:
          data.engineerContact.personId && data.engineerContact.personId !== "none"
            ? data.engineerContact.personId
            : undefined,
      }
    : undefined;

  const business = await LifeBusiness.create({
    name: data.name,
    legalName: data.legalName || "",
    ownershipPercentage: Number(data.ownershipPercentage) || 100,
    status: data.status || "active",
    partners: formattedPartners,
    serverInfo: data.serverInfo || {},
    engineerContact: engineerClean,
    supplierContact: data.supplierContact || {},
    monthlyExpenses: Number(data.monthlyExpenses) || 0,
    outstandingPayments: Number(data.outstandingPayments) || 0,
    receivables: Number(data.receivables) || 0,
    instructions: data.instructions || "",
    continuitySteps: [],
  });

  await logLifeActivity({
    action: "CREATE_BUSINESS",
    resourceType: "business",
    resourceId: String(business._id),
    resourceName: business.name,
    details: `Added new business entity: ${business.name}`,
  });

  revalidatePath("/business");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(business));
}

export async function updateBusiness(
  id: string,
  data: Partial<ILifeBusiness>
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can modify businesses.");
  }

  const updated = (await LifeBusiness.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean()) as (ILifeBusiness & { _id: unknown }) | null;

  if (updated) {
    await logLifeActivity({
      action: "UPDATE_BUSINESS",
      resourceType: "business",
      resourceId: id,
      resourceName: updated.name,
      details: `Updated business profile: ${updated.name}`,
    });
  }

  revalidatePath("/business");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(updated));
}

export async function addContinuityStep(
  businessId: string,
  stepData: {
    title: string;
    description?: string;
    responsiblePersonId?: string;
    responsiblePersonName?: string;
    contactPhone?: string;
    instructions?: string;
    documents?: string[];
  }
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden");
  }

  const business = await LifeBusiness.findById(businessId);
  if (!business) throw new Error("Business not found");

  const newStep: ILifeContinuityStep = {
    id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    order: (business.continuitySteps?.length || 0) + 1,
    title: stepData.title,
    description: stepData.description || "",
    responsiblePersonId:
      stepData.responsiblePersonId && stepData.responsiblePersonId !== "none"
        ? (stepData.responsiblePersonId as string)
        : undefined,
    responsiblePersonName: stepData.responsiblePersonName || "",
    contactPhone: stepData.contactPhone || "",
    instructions: stepData.instructions || "",
    documents: stepData.documents || [],
    isCompleted: false,
  };

  business.continuitySteps.push(newStep);
  await business.save();

  await logLifeActivity({
    action: "ADD_CONTINUITY_STEP",
    resourceType: "business",
    resourceId: businessId,
    resourceName: business.name,
    details: `Added "If I Am Not Available" instruction: "${newStep.title}" to ${business.name}`,
  });

  revalidatePath("/business");
  revalidatePath("/");
  return { success: true };
}

export async function toggleContinuityStep(
  businessId: string,
  stepId: string,
  isCompleted: boolean
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const business = await LifeBusiness.findById(businessId);
  if (!business) throw new Error("Business not found");

  const step = business.continuitySteps.find((s: ILifeContinuityStep) => s.id === stepId);
  if (step) {
    step.isCompleted = isCompleted;
    await business.save();

    await logLifeActivity({
      action: "TOGGLE_CONTINUITY_STEP",
      resourceType: "business",
      resourceId: businessId,
      resourceName: business.name,
      details: `Marked continuity step "${step.title}" as ${
        isCompleted ? "COMPLETED" : "PENDING"
      }`,
    });
  }

  revalidatePath("/business");
  revalidatePath("/");
  return { success: true };
}

export async function deleteContinuityStep(businessId: string, stepId: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) throw new Error("Forbidden");

  await LifeBusiness.findByIdAndUpdate(businessId, {
    $pull: { continuitySteps: { id: stepId } },
  });

  revalidatePath("/business");
  revalidatePath("/");
  return { success: true };
}
