"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/database";
import LifeFinancialSupport from "@/lib/database/models/lifeFinancialSupport.model";
import LifeInstallment from "@/lib/database/models/lifeInstallment.model";
import LifePaymentConfirmation from "@/lib/database/models/lifePaymentConfirmation.model";
import LifeFinancialHistory from "@/lib/database/models/lifeFinancialHistory.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import { getLifeAuthContext, requireOwnerOrAdmin, logLifeActivity } from "@/lib/life/auth";
import {
  FinancialSupportType,
  FinancialSupportStatus,
  InstallmentFrequency,
} from "@/types";

/**
 * Gets financial support records with strict person-wise privacy (§13, §30 item 1, 11).
 * Non-owner can ONLY retrieve records assigned to themselves.
 */
export async function getFinancialSupports(filterPersonId?: string) {
  try {
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized: Please log in.");

    await connectToDatabase();

    const query: Record<string, any> = {};

    if (!context.isOwner && !context.isAdmin) {
      if (!context.personId) return [];
      query.recipientPersonId = context.personId;
    } else if (filterPersonId) {
      query.recipientPersonId = filterPersonId;
    }

    const records = await LifeFinancialSupport.find(query)
      .populate("recipientPersonId", "name phone email relation")
      .populate("relatedBusinessId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(records));
  } catch (error: any) {
    console.error("Error in getFinancialSupports:", error);
    return [];
  }
}

export async function getFinancialSupportById(id: string) {
  try {
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized");

    await connectToDatabase();
    const record = await LifeFinancialSupport.findById(id)
      .populate("recipientPersonId")
      .populate("relatedBusinessId")
      .lean();

    if (!record) return null;

    // Strict privacy enforcement (§13)
    const recAny = record as any;
    if (
      !context.isOwner &&
      !context.isAdmin &&
      String(recAny.recipientPersonId?._id || recAny.recipientPersonId) !== String(context.personId)
    ) {
      throw new Error("Access Denied: You cannot view financial records of other people.");
    }

    const installments = await LifeInstallment.find({ financialSupportId: id })
      .sort({ installmentNumber: 1 })
      .lean();

    const history = await LifeFinancialHistory.find({ financialSupportId: id })
      .sort({ createdAt: -1 })
      .lean();

    const pendingConfirmations = await LifePaymentConfirmation.find({ financialSupportId: id })
      .sort({ createdAt: -1 })
      .lean();

    return {
      record: JSON.parse(JSON.stringify(record)),
      installments: JSON.parse(JSON.stringify(installments)),
      history: JSON.parse(JSON.stringify(history)),
      pendingConfirmations: JSON.parse(JSON.stringify(pendingConfirmations)),
    };
  } catch (error: any) {
    console.error("Error in getFinancialSupportById:", error);
    return null;
  }
}

export async function createFinancialSupport(data: {
  title: string;
  recipientPersonId: string;
  supportType: FinancialSupportType;
  relatedBusinessId?: string;
  totalAmount: number;
  currency: string;
  givenDate: Date | string;
  paymentMethod: string;
  transactionReference?: string;
  purpose?: string;
  repayableOrNot: boolean;
  repaymentStartDate?: Date | string;
  installmentFrequency?: InstallmentFrequency;
  installmentAmount?: number;
  numberOfInstallments?: number;
  dueDate?: Date | string;
  gracePeriod?: number;
  supportingDocument?: string;
  ownerPrivateNote?: string;
  recipientVisibleNote?: string;
}) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const totalAmount = Number(data.totalAmount) || 0;
    const remainingBalance = data.repayableOrNot ? totalAmount : 0;
    const initialStatus = data.repayableOrNot
      ? (data.repaymentStartDate ? "repayment_not_started" : "active")
      : (data.supportType === "gift" ? "gift" : "active");

    const record = await LifeFinancialSupport.create({
      ...data,
      totalAmount,
      totalRepaid: 0,
      remainingBalance,
      status: initialStatus,
      createdBy: context.name,
      giftConversions: [],
    });

    // Write immutable timeline entry (§12)
    await LifeFinancialHistory.create({
      financialSupportId: record._id,
      eventType: "support_created",
      description: `Support created: ${data.title} (${data.currency} ${totalAmount.toLocaleString()})`,
      amount: totalAmount,
      performedBy: context.name,
    });

    // Auto-generate installments if schedule specified
    if (
      data.repayableOrNot &&
      data.installmentAmount &&
      data.installmentAmount > 0 &&
      data.numberOfInstallments &&
      data.numberOfInstallments > 0 &&
      data.repaymentStartDate
    ) {
      await generateInstallmentScheduleInternal(
        String(record._id),
        data.installmentFrequency || "monthly",
        new Date(data.repaymentStartDate),
        data.installmentAmount,
        data.numberOfInstallments
      );
    }

    await logLifeActivity({
      action: "CREATE_FINANCIAL_SUPPORT",
      resourceType: "financial_support",
      resourceId: String(record._id),
      resourceName: data.title,
      details: `Created financial support of ${data.currency} ${totalAmount} for recipient.`,
      newValue: String(totalAmount),
    });

    revalidatePath("/finance");
    revalidatePath(`/people/${data.recipientPersonId}`);
    return { success: true, record: JSON.parse(JSON.stringify(record)) };
  } catch (error: any) {
    console.error("Error in createFinancialSupport:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generates an installment schedule preserving previous version history (§11, §30 item 10).
 */
export async function generateInstallmentSchedule(
  financialSupportId: string,
  frequency: InstallmentFrequency,
  startDate: Date | string,
  amount: number,
  count: number
) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    await generateInstallmentScheduleInternal(
      financialSupportId,
      frequency,
      new Date(startDate),
      amount,
      count,
      context.name
    );

    revalidatePath(`/finance/${financialSupportId}`);
    revalidatePath("/finance");
    return { success: true };
  } catch (error: any) {
    console.error("Error in generateInstallmentSchedule:", error);
    return { success: false, error: error.message };
  }
}

async function generateInstallmentScheduleInternal(
  supportId: string,
  frequency: InstallmentFrequency,
  start: Date,
  amount: number,
  count: number,
  performedBy: string = "System"
) {
  const existing = await LifeInstallment.find({ financialSupportId: supportId }).sort({ installmentNumber: 1 });

  // If previous installments existed, preserve their versions before replacement
  for (let i = 0; i < count; i++) {
    const dueDate = new Date(start);
    if (frequency === "monthly") {
      dueDate.setMonth(dueDate.getMonth() + i);
    } else if (frequency === "weekly") {
      dueDate.setDate(dueDate.getDate() + i * 7);
    } else if (frequency === "yearly") {
      dueDate.setFullYear(dueDate.getFullYear() + i);
    }

    const existingInst = existing.find((e) => e.installmentNumber === i + 1);
    if (existingInst) {
      existingInst.previousVersions.push({
        expectedAmount: existingInst.expectedAmount,
        dueDate: existingInst.dueDate,
        changedAt: new Date(),
        reason: "Schedule recalculated by Owner",
      });
      existingInst.expectedAmount = amount;
      existingInst.remainingAmount = Math.max(0, amount - existingInst.paidAmount);
      existingInst.dueDate = dueDate;
      await existingInst.save();
    } else {
      await LifeInstallment.create({
        financialSupportId: supportId,
        installmentNumber: i + 1,
        dueDate,
        expectedAmount: amount,
        paidAmount: 0,
        remainingAmount: amount,
        status: "upcoming",
        previousVersions: [],
      });
    }
  }

  // Record timeline entry (§12)
  await LifeFinancialHistory.create({
    financialSupportId: supportId,
    eventType: "schedule_added",
    description: `Installment schedule updated: ${count} installments of ${amount.toLocaleString()}`,
    amount,
    performedBy,
  });
}

/**
 * User submits payment for verification (§14).
 * IMPORTANT: Does NOT directly reduce balance until confirmed (§30 item 8).
 */
export async function submitPayment({
  financialSupportId,
  installmentId,
  amount,
  paymentDate,
  paymentMethod,
  transactionReference = "",
  receiptUrl = "",
}: {
  financialSupportId: string;
  installmentId?: string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: string;
  transactionReference?: string;
  receiptUrl?: string;
}) {
  try {
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized");

    await connectToDatabase();
    const support = await LifeFinancialSupport.findById(financialSupportId);
    if (!support) throw new Error("Financial record not found");

    const confirmation = await LifePaymentConfirmation.create({
      financialSupportId,
      installmentId: installmentId || undefined,
      submittedByPersonId: context.personId || undefined,
      submittedByName: context.name,
      amount: Number(amount),
      currency: support.currency,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      transactionReference,
      receiptUrl,
      status: "submitted",
    });

    await logLifeActivity({
      action: "SUBMIT_PAYMENT_FOR_CONFIRMATION",
      resourceType: "payment_confirmation",
      resourceId: String(confirmation._id),
      resourceName: support.title,
      details: `${context.name} submitted payment of ${support.currency} ${amount} for review.`,
    });

    revalidatePath(`/finance/${financialSupportId}`);
    return { success: true, confirmation: JSON.parse(JSON.stringify(confirmation)) };
  } catch (error: any) {
    console.error("Error in submitPayment:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Owner/Admin confirms or rejects a submitted payment (§14, §30 item 8).
 * Balance ONLY updates after approval!
 */
export async function confirmPayment({
  confirmationId,
  action,
  reviewNote = "",
}: {
  confirmationId: string;
  action: "approved" | "rejected" | "correction_required";
  reviewNote?: string;
}) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const confirmation = await LifePaymentConfirmation.findById(confirmationId);
    if (!confirmation) throw new Error("Payment confirmation record not found");

    if (confirmation.status === "approved") {
      throw new Error("This payment has already been approved.");
    }

    confirmation.status = action;
    confirmation.reviewedBy = context.name;
    confirmation.reviewedAt = new Date();
    confirmation.reviewNote = reviewNote;
    await confirmation.save();

    if (action === "approved") {
      const support = await LifeFinancialSupport.findById(confirmation.financialSupportId);
      if (support) {
        const prevRemaining = support.remainingBalance;
        support.totalRepaid += confirmation.amount;
        support.remainingBalance = Math.max(0, support.remainingBalance - confirmation.amount);
        if (support.remainingBalance === 0) {
          support.status = "fully_repaid";
        } else {
          support.status = "partially_repaid";
        }
        await support.save();

        // Update installment if linked
        if (confirmation.installmentId) {
          const installment = await LifeInstallment.findById(confirmation.installmentId);
          if (installment) {
            installment.paidAmount += confirmation.amount;
            installment.remainingAmount = Math.max(0, installment.remainingAmount - confirmation.amount);
            installment.paymentDate = confirmation.paymentDate;
            installment.paymentMethod = confirmation.paymentMethod;
            installment.transactionReference = confirmation.transactionReference;
            installment.receiptUrl = confirmation.receiptUrl;
            installment.status = installment.remainingAmount === 0 ? "paid" : "partially_paid";
            await installment.save();
          }
        }

        // Timeline entry (§12)
        await LifeFinancialHistory.create({
          financialSupportId: support._id,
          eventType: support.remainingBalance === 0 ? "fully_repaid" : "installment_paid",
          description: `Payment approved: ${support.currency} ${confirmation.amount.toLocaleString()} via ${confirmation.paymentMethod}`,
          amount: confirmation.amount,
          previousValue: String(prevRemaining),
          newValue: String(support.remainingBalance),
          performedBy: context.name,
        });
      }
    }

    await logLifeActivity({
      action: `PAYMENT_${action.toUpperCase()}`,
      resourceType: "payment_confirmation",
      resourceId: confirmationId,
      details: `Payment of ${confirmation.currency} ${confirmation.amount} was ${action} by ${context.name}.`,
    });

    revalidatePath(`/finance/${confirmation.financialSupportId}`);
    revalidatePath("/finance");
    return { success: true };
  } catch (error: any) {
    console.error("Error in confirmPayment:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Waive amount from support record (§13, §15).
 */
export async function waiveAmount(
  financialSupportId: string,
  amount: number,
  note: string = ""
) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const support = await LifeFinancialSupport.findById(financialSupportId);
    if (!support) throw new Error("Financial record not found");

    const waiveVal = Number(amount);
    const prevBalance = support.remainingBalance;
    support.remainingBalance = Math.max(0, support.remainingBalance - waiveVal);
    if (support.remainingBalance === 0) {
      support.status = "waived";
    }
    await support.save();

    await LifeFinancialHistory.create({
      financialSupportId,
      eventType: "amount_waived",
      description: `Amount waived by Owner: ${support.currency} ${waiveVal.toLocaleString()}. Note: ${note}`,
      amount: waiveVal,
      previousValue: String(prevBalance),
      newValue: String(support.remainingBalance),
      performedBy: context.name,
    });

    await logLifeActivity({
      action: "WAIVE_FINANCIAL_AMOUNT",
      resourceType: "financial_support",
      resourceId: financialSupportId,
      resourceName: support.title,
      details: `Waived ${support.currency} ${waiveVal} for ${support.title}.`,
      newValue: String(support.remainingBalance),
    });

    revalidatePath(`/finance/${financialSupportId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error in waiveAmount:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Converts part or full repayable support into a Gift (§15, §30 item 9).
 * Preserves the previous loan and support history!
 */
export async function convertToGift({
  financialSupportId,
  amount,
  conversionType,
  ownerNote = "",
  supportingDocument = "",
}: {
  financialSupportId: string;
  amount: number;
  conversionType: "partial" | "full";
  ownerNote?: string;
  supportingDocument?: string;
}) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const support = await LifeFinancialSupport.findById(financialSupportId);
    if (!support) throw new Error("Financial record not found");

    const giftAmount = conversionType === "full" ? support.remainingBalance : Number(amount);
    const prevRemaining = support.remainingBalance;
    const newRemaining = Math.max(0, support.remainingBalance - giftAmount);

    support.giftConversions.push({
      amount: giftAmount,
      conversionType,
      previousRemaining: prevRemaining,
      newRemaining,
      conversionDate: new Date(),
      ownerNote,
      supportingDocument,
      createdAt: new Date(),
    });

    support.remainingBalance = newRemaining;
    if (newRemaining === 0) {
      support.status = "converted_to_gift";
    }

    await support.save();

    // Timeline entry (§12, §15)
    await LifeFinancialHistory.create({
      financialSupportId,
      eventType: "converted_to_gift",
      description: `Converted to ${conversionType === "full" ? "Full" : "Partial"} Gift: ${support.currency} ${giftAmount.toLocaleString()}. Note: ${ownerNote}`,
      amount: giftAmount,
      previousValue: String(prevRemaining),
      newValue: String(newRemaining),
      performedBy: context.name,
    });

    await logLifeActivity({
      action: "CONVERT_TO_GIFT",
      resourceType: "financial_support",
      resourceId: financialSupportId,
      resourceName: support.title,
      details: `Converted ${support.currency} ${giftAmount} to gift. Previous balance was ${prevRemaining}, new balance is ${newRemaining}.`,
      isCritical: true,
    });

    revalidatePath(`/finance/${financialSupportId}`);
    revalidatePath("/finance");
    return { success: true };
  } catch (error: any) {
    console.error("Error in convertToGift:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Returns person summary dashboard numbers (§16) with respectful phrasing.
 */
export async function getFinancialSummaryForUser(targetPersonId?: string) {
  try {
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized");

    await connectToDatabase();

    const personId = !context.isOwner && !context.isAdmin ? context.personId : targetPersonId || context.personId;
    if (!personId) return null;

    const records = await LifeFinancialSupport.find({ recipientPersonId: personId }).lean();

    let totalReceived = 0;
    let repayableAmount = 0;
    let giftAmount = 0;
    let totalRepaid = 0;
    let remainingBalance = 0;

    for (const r of records) {
      totalReceived += r.totalAmount || 0;
      if (r.repayableOrNot && r.status !== "converted_to_gift" && r.status !== "gift") {
        repayableAmount += r.totalAmount || 0;
        totalRepaid += r.totalRepaid || 0;
        remainingBalance += r.remainingBalance || 0;
      } else {
        giftAmount += r.totalAmount || 0;
      }
    }

    return {
      totalReceived,
      repayableAmount,
      giftAmount,
      totalRepaid,
      remainingBalance,
      currency: records[0]?.currency || "BDT",
      recordsCount: records.length,
    };
  } catch (error: any) {
    console.error("Error in getFinancialSummaryForUser:", error);
    return null;
  }
}

/**
 * Returns owner financial dashboard data grouped by currency without cross-currency mix (§17).
 */
export async function getOwnerFinancialDashboard() {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const records = await LifeFinancialSupport.find()
      .populate("recipientPersonId", "name relation")
      .populate("relatedBusinessId", "name")
      .lean();

    // Group strictly by currency (§17)
    const currencyMap: Record<string, { totalGiven: number; totalRepaid: number; remaining: number; gifts: number }> = {};

    for (const r of records) {
      const cur = (r.currency || "BDT").toUpperCase();
      if (!currencyMap[cur]) {
        currencyMap[cur] = { totalGiven: 0, totalRepaid: 0, remaining: 0, gifts: 0 };
      }
      currencyMap[cur].totalGiven += r.totalAmount || 0;
      currencyMap[cur].totalRepaid += r.totalRepaid || 0;
      currencyMap[cur].remaining += r.remainingBalance || 0;
      if (!r.repayableOrNot || r.status === "converted_to_gift" || r.status === "gift") {
        currencyMap[cur].gifts += r.totalAmount || 0;
      }
    }

    const pendingApprovalsCount = await LifePaymentConfirmation.countDocuments({ status: "submitted" });

    return {
      currencyMap,
      totalRecords: records.length,
      pendingApprovalsCount,
      recentRecords: JSON.parse(JSON.stringify(records.slice(0, 10))),
    };
  } catch (error: any) {
    console.error("Error in getOwnerFinancialDashboard:", error);
    return null;
  }
}
