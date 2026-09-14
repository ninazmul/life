"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/database";
import LifeEmergencyRecoveryEvent from "@/lib/database/models/lifeEmergencyRecoveryEvent.model";
import LifeEmergencyAccess from "@/lib/database/models/lifeEmergencyAccess.model";
import LifeSettings from "@/lib/database/models/lifeSettings.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { verifyPin } from "@/lib/life/crypto";
import {
  notifyEmergencyTriggered,
  notifyVaultLockTriggered,
  notifyEmergencyCancelled,
  notifyEmergencyActivated,
  notifyEmergencyExpired,
} from "@/lib/life/notifications";
import { ILifeEmergencyRecoveryEvent } from "@/types";

/**
 * Helper to extract client device and IP safely from headers.
 */
async function getClientMetadata() {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown Browser";
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";
    return { userAgent, ip };
  } catch {
    return { userAgent: "System Action", ip: "127.0.0.1" };
  }
}

/**
 * 1. TRIGGER EMERGENCY RECOVERY BUTTON
 * Activated by an authorized Emergency Contact / Guardian.
 * Initiates 48-Hour Cancellation Period & Super Admin Email Alerts.
 */
export async function triggerEmergencyRecoveryButton(data: {
  reason?: string;
  reasonDetails?: string;
}) {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) throw new Error("Unauthorized: Please sign in.");

    // The Main Vault Owner cannot trigger emergency mode on themselves (emergency is for when owner is unavailable)
    if (auth.isOwner) {
      throw new Error(
        "Forbidden: The Main User cannot trigger Emergency Mode. It must be initiated by designated Emergency Contacts or Guardians."
      );
    }

    // Must be either an emergency contact, guardian, or administrator
    const hasEmergencyPerm =
      auth.permissions?.canAccessEmergency || auth.isGuardian || auth.isAdmin;
    if (!hasEmergencyPerm) {
      throw new Error(
        "Forbidden: Only designated Emergency Contacts or Guardians are authorized to activate Emergency Recovery."
      );
    }

    // Check if an emergency recovery is already pending or active
    const activeEvent = await LifeEmergencyRecoveryEvent.findOne({
      status: { $in: ["EMERGENCY_PENDING", "EMERGENCY_ACTIVATED"] },
    });
    if (activeEvent) {
      throw new Error(
        `An emergency recovery event is already ${activeEvent.status}. Multiple simultaneous recovery events are prohibited.`
      );
    }

    const { userAgent, ip } = await getClientMetadata();
    const now = new Date();
    // 48 hours server-side countdown
    const countdownEndsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const event = await LifeEmergencyRecoveryEvent.create({
      eventType: "emergency_button",
      status: "EMERGENCY_PENDING",
      triggeredBy: {
        personId: auth.personId || undefined,
        name: auth.name || "Emergency Contact",
        email: auth.email,
        role: auth.role || "emergency_contact",
      },
      triggeredAt: now,
      reason: data.reason || data.reasonDetails || "Emergency assistance requested / Owner unavailable",
      deviceInfo: { userAgent, ip },
      countdownEndsAt,
      simulationFastForwardHours: 0,
      remindersSent: [],
      emergencyAccessPolicy: {
        grantedRecordIds: [],
        grantedVaultItemIds: [],
        isRevoked: false,
      },
    });

    // Update global emergency state
    await LifeEmergencyAccess.findOneAndUpdate(
      {},
      {
        recoveryState: "EMERGENCY_PENDING",
        activeRecoveryEventId: event._id,
        ownerSafetyStatus: "emergency",
      },
      { upsert: true }
    );

    // Dispatch email alert to all configured Super Admins
    await notifyEmergencyTriggered({
      eventId: String(event._id),
      eventType: "emergency_button",
      triggeredByName: auth.name || "Emergency Contact",
      triggeredByEmail: auth.email,
      triggeredAt: now,
      countdownEndsAt,
      hoursRemaining: 48,
      reason: event.reason,
      deviceInfo: { userAgent, ip },
    });

    // Record immutable audit log
    await logLifeActivity({
      action: "EMERGENCY_RECOVERY_TRIGGERED",
      resourceType: "emergency_recovery",
      resourceId: String(event._id),
      details: `Emergency Recovery triggered by ${auth.name} (${auth.email}). 48-Hour countdown initiated.`,
      metadata: { ip, userAgent },
      isCritical: true,
    });

    revalidatePath("/access");
    revalidatePath("/");
    return {
      success: true,
      event: JSON.parse(JSON.stringify(event)),
    };
  } catch (err: any) {
    console.error("Error in triggerEmergencyRecoveryButton:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 2. OWNER / SUPER ADMIN CANCELLATION
 * Authorized Super Admins can cancel the recovery event within the 48-hour period.
 * Requires strong Master PIN / Password verification.
 */
export async function cancelEmergencyRecovery({
  eventId,
  verificationPin,
  reason = "False alarm / Owner confirmed safe",
}: {
  eventId: string;
  verificationPin: string;
  reason?: string;
}) {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) throw new Error("Unauthorized: Please sign in.");

    if (!auth.isOwner && !auth.isAdmin) {
      throw new Error(
        "Forbidden: Only authorized Super Admins or the Owner can cancel Emergency Recovery."
      );
    }

    if (!verificationPin || verificationPin.trim() === "") {
      throw new Error("Master Security PIN is required to cancel Emergency Recovery.");
    }

    // Strong re-verification check
    const settings = (await LifeSettings.findOne().lean()) as { vaultPinHash?: string } | null;
    if (settings?.vaultPinHash && settings.vaultPinHash.trim() !== "") {
      const isValid = verifyPin(verificationPin, settings.vaultPinHash);
      if (!isValid) {
        await logLifeActivity({
          action: "EMERGENCY_CANCEL_AUTH_FAILED",
          resourceType: "emergency_recovery",
          resourceId: eventId,
          details: `Failed PIN verification attempt while trying to cancel emergency recovery by ${auth.email}.`,
          isCritical: true,
        });
        throw new Error("Invalid Master Security PIN. Cancellation denied.");
      }
    }

    const event = await LifeEmergencyRecoveryEvent.findById(eventId);
    if (!event) throw new Error("Emergency Recovery event not found.");

    if (event.status === "CANCELLED") {
      throw new Error("This recovery event has already been cancelled.");
    }

    const { userAgent, ip } = await getClientMetadata();
    const now = new Date();

    event.status = "CANCELLED";
    event.cancelledBy = {
      personId: auth.personId || undefined,
      name: auth.name || "Super Admin",
      email: auth.email,
      cancelledAt: now,
      verificationMethod: "master_pin",
    };
    await event.save();

    // Reset emergency access state
    await LifeEmergencyAccess.findOneAndUpdate(
      {},
      {
        recoveryState: "NORMAL",
        vaultRecoveryState: "VAULT_NORMAL",
        isEmergencyActive: false,
        isVaultLocked: false,
        consecutiveVaultFailures: 0,
        activeRecoveryEventId: null,
        ownerSafetyStatus: "safe",
        lastSafetyCheckIn: now,
      }
    );

    // Notify contacts and admins
    const contactEmails = [event.triggeredBy.email].filter(Boolean);
    await notifyEmergencyCancelled(
      {
        eventId: String(event._id),
        eventType: event.eventType,
        triggeredByName: event.triggeredBy.name,
        triggeredByEmail: event.triggeredBy.email,
        triggeredAt: event.triggeredAt,
        countdownEndsAt: event.countdownEndsAt,
        cancelledByName: auth.name,
      },
      contactEmails
    );

    // Record immutable audit log
    await logLifeActivity({
      action: "EMERGENCY_RECOVERY_CANCELLED_BY_OWNER",
      resourceType: "emergency_recovery",
      resourceId: String(event._id),
      details: `Emergency recovery cancelled by Super Admin ${auth.name} (${auth.email}) with verified Master PIN. Reason: ${reason}. System returned to NORMAL.`,
      metadata: { ip, userAgent },
      isCritical: true,
    });

    revalidatePath("/access");
    revalidatePath("/vault");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error in cancelEmergencyRecovery:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 3. EVALUATE AND PROCESS RECOVERY EVENTS
 * Checks if 48 hours have elapsed for active pending events.
 * If 48 hours elapsed without cancellation, activates controlled continuity access.
 * Checks for expired access and automatically revokes.
 */
export async function checkAndProcessRecoveryEvents() {
  try {
    await connectToDatabase();
    const activeEvents = await LifeEmergencyRecoveryEvent.find({
      status: { $in: ["EMERGENCY_PENDING", "VAULT_LOCKED_PENDING", "EMERGENCY_ACTIVATED"] },
    });

    const now = Date.now();

    for (const event of activeEvents) {
      // Effective time takes into account any test fast-forward simulation hours
      const simulationOffsetMs = (event.simulationFastForwardHours || 0) * 60 * 60 * 1000;
      const effectiveNow = now + simulationOffsetMs;
      const deadlineMs = new Date(event.countdownEndsAt).getTime();

      // Case A: 48 Hours elapsed for Emergency Button -> Activate Predefined Policy
      if (event.status === "EMERGENCY_PENDING" && effectiveNow >= deadlineMs) {
        event.status = "EMERGENCY_ACTIVATED";
        event.activatedAt = new Date();
        // Emergency access duration e.g. 72 hours temporary access
        const accessExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
        event.emergencyAccessPolicy = {
          accessStartsAt: new Date(),
          accessExpiresAt,
          grantedRecordIds: [],
          grantedVaultItemIds: [],
          isRevoked: false,
        };
        await event.save();

        await LifeEmergencyAccess.findOneAndUpdate(
          {},
          {
            isEmergencyActive: true,
            recoveryState: "EMERGENCY_ACTIVATED",
            activatedBy: event.triggeredBy.name,
            activatedAt: new Date(),
            ownerSafetyStatus: "emergency",
          }
        );

        await notifyEmergencyActivated({
          eventId: String(event._id),
          eventType: event.eventType,
          triggeredByName: event.triggeredBy.name,
          triggeredByEmail: event.triggeredBy.email,
          triggeredAt: event.triggeredAt,
          countdownEndsAt: event.countdownEndsAt,
        });

        await logLifeActivity({
          action: "EMERGENCY_CONTINUITY_ACTIVATED",
          resourceType: "emergency_recovery",
          resourceId: String(event._id),
          details: `48-hour cancellation window elapsed. Predefined Emergency Continuity Policy activated for authorized contacts. Master Vault secrets remain protected.`,
          isCritical: true,
        });
      }

      // Case B: 48 Hours elapsed for Vault 15-Failure Lock -> Controlled Vault Recovery
      if (event.status === "VAULT_LOCKED_PENDING" && effectiveNow >= deadlineMs) {
        event.status = "VAULT_RECOVERY_ACTIVATED";
        event.activatedAt = new Date();
        await event.save();

        await LifeEmergencyAccess.findOneAndUpdate(
          {},
          {
            vaultRecoveryState: "VAULT_RECOVERY_ACTIVATED",
            isVaultLocked: false,
            consecutiveVaultFailures: 0,
          }
        );

        await logLifeActivity({
          action: "VAULT_RECOVERY_POLICY_ACTIVATED",
          resourceType: "vault",
          resourceId: String(event._id),
          details: `48-hour vault recovery window elapsed. Vault lock cleared for credential re-enrollment. Encrypted data fully preserved.`,
          isCritical: true,
        });
      }

      // Case C: Emergency Access expired -> Revoke
      if (event.status === "EMERGENCY_ACTIVATED") {
        const expiresAt = event.emergencyAccessPolicy?.accessExpiresAt;
        if (expiresAt && effectiveNow >= new Date(expiresAt).getTime()) {
          event.status = "EXPIRED";
          if (event.emergencyAccessPolicy) {
            event.emergencyAccessPolicy.isRevoked = true;
          }
          await event.save();

          await LifeEmergencyAccess.findOneAndUpdate(
            {},
            {
              isEmergencyActive: false,
              recoveryState: "NORMAL",
              ownerSafetyStatus: "safe",
            }
          );

          await notifyEmergencyExpired({
            eventId: String(event._id),
            eventType: event.eventType,
            triggeredByName: event.triggeredBy.name,
            triggeredByEmail: event.triggeredBy.email,
            triggeredAt: event.triggeredAt,
            countdownEndsAt: event.countdownEndsAt,
          });

          await logLifeActivity({
            action: "EMERGENCY_ACCESS_EXPIRED_REVOKED",
            resourceType: "emergency_recovery",
            resourceId: String(event._id),
            details: `Temporary emergency access duration expired. All emergency access automatically revoked.`,
          });
        }
      }
    }

    revalidatePath("/access");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error in checkAndProcessRecoveryEvents:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 4. TESTABLE TIME SIMULATION (Fast-Forward by N Hours)
 * Allows developers and admins to advance the 48-hour timer for automated or interactive verification.
 */
export async function fastForwardRecoverySimulation({
  eventId,
  hours = 48,
}: {
  eventId: string;
  hours?: number;
}) {
  try {
    await connectToDatabase();
    const event = await LifeEmergencyRecoveryEvent.findById(eventId);
    if (!event) throw new Error("Recovery event not found.");

    event.simulationFastForwardHours = (event.simulationFastForwardHours || 0) + hours;
    await event.save();

    // Run processor to evaluate state transitions immediately
    await checkAndProcessRecoveryEvents();

    revalidatePath("/access");
    revalidatePath("/");
    return {
      success: true,
      simulationFastForwardHours: event.simulationFastForwardHours,
    };
  } catch (err: any) {
    console.error("Error in fastForwardRecoverySimulation:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 5. GET ACTIVE RECOVERY EVENT & COUNTDOWN
 */
export async function getActiveRecoveryEvent(): Promise<{
  activeEvent: ILifeEmergencyRecoveryEvent | null;
  secondsRemaining: number;
}> {
  try {
    await connectToDatabase();
    // Automatically evaluate expiration on fetch
    await checkAndProcessRecoveryEvents();

    const event = (await LifeEmergencyRecoveryEvent.findOne({
      status: { $in: ["EMERGENCY_PENDING", "VAULT_LOCKED_PENDING", "EMERGENCY_ACTIVATED"] },
    })
      .sort({ createdAt: -1 })
      .lean()) as any;

    if (!event) return { activeEvent: null, secondsRemaining: 0 };

    const simulationOffsetMs = (event.simulationFastForwardHours || 0) * 60 * 60 * 1000;
    const effectiveNow = Date.now() + simulationOffsetMs;
    const deadlineMs = new Date(event.countdownEndsAt).getTime();
    const msRemaining = Math.max(0, deadlineMs - effectiveNow);
    const secondsRemaining = Math.floor(msRemaining / 1000);

    return {
      activeEvent: JSON.parse(JSON.stringify(event)),
      secondsRemaining,
    };
  } catch (err: any) {
    console.error("Error in getActiveRecoveryEvent:", err);
    return { activeEvent: null, secondsRemaining: 0 };
  }
}

/**
 * 6. GET RECOVERY EVENTS AUDIT HISTORY
 */
export async function getRecoveryEventsHistory(): Promise<ILifeEmergencyRecoveryEvent[]> {
  try {
    await connectToDatabase();
    const events = await LifeEmergencyRecoveryEvent.find()
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(events));
  } catch (err: any) {
    console.error("Error in getRecoveryEventsHistory:", err);
    return [];
  }
}
