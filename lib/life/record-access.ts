import { connectToDatabase } from "@/lib/database";
import LifeRecordPermission from "@/lib/database/models/lifeRecordPermission.model";
import LifeEmergencyAccess from "@/lib/database/models/lifeEmergencyAccess.model";
import { LifeAuthContext } from "@/lib/life/auth";
import { RecordType, VisibilityMode } from "@/types";

export interface RecordAccessResult {
  canAccess: boolean;
  isProtected: boolean;
  reason?: string;
  visibilityMode?: VisibilityMode;
  reVerificationRequired?: boolean;
}

/**
 * Checks if a visibility mode represents a protected/future access level (§1, §2).
 */
export function isProtectedVisibility(visibility: string): boolean {
  return [
    "emergency_only",
    "after_death_only",
    "emergency_or_after_death",
    "manual_release",
    "hidden_draft",
    "revoked_archived",
  ].includes(visibility);
}

/**
 * Evaluates whether the authenticated user has access to a specific record (§3, §30).
 *
 * Rules:
 * 1. Owner always has full access.
 * 2. If user is not Owner, check if record is assigned to user's personId.
 * 3. If visibility is "owner_only", deny non-owner.
 * 4. If visibility is "available_now", permit assigned person.
 * 5. If visibility is "emergency_only" or "emergency_or_after_death", emergency protocol must be active
 *    AND the record must be released (or emergency access active).
 * 6. If visibility is "scheduled_release", current date must be >= effectiveDate.
 * 7. If visibility is "manual_release", isReleased must be true.
 */
export async function checkRecordAccess(
  context: LifeAuthContext | null,
  recordId: string,
  recordType: RecordType,
  assignedPersonId?: string,
  visibilityMode: string = "available_now"
): Promise<RecordAccessResult> {
  if (!context) {
    return { canAccess: false, isProtected: false, reason: "Unauthorized: Please log in." };
  }

  // Owner has absolute access
  if (context.isOwner) {
    return {
      canAccess: true,
      isProtected: false,
      visibilityMode: visibilityMode as VisibilityMode,
    };
  }

  const userPersonId = context.personId;
  if (!userPersonId) {
    return { canAccess: false, isProtected: false, reason: "No person record linked to your account." };
  }

  // Check if assigned to this user
  const isAssigned = assignedPersonId
    ? String(assignedPersonId) === String(userPersonId)
    : false;

  // Query explicit permission record if one exists
  await connectToDatabase();
  const permDoc = await LifeRecordPermission.findOne({
    recordId,
    assignedPersonId: userPersonId,
  });

  const effectiveMode = (permDoc?.visibilityMode || visibilityMode || "available_now") as VisibilityMode;
  const isProtected = isProtectedVisibility(effectiveMode);

  if (!isAssigned && !permDoc) {
    return {
      canAccess: false,
      isProtected,
      reason: "Forbidden: You are not authorized to view this record.",
    };
  }

  // Owner only records can NEVER be viewed by other users
  if (effectiveMode === "owner_only" || effectiveMode === "hidden_draft" || effectiveMode === "revoked_archived") {
    return {
      canAccess: false,
      isProtected: true,
      visibilityMode: effectiveMode,
      reason: "This record is restricted.",
    };
  }

  // Available now
  if (effectiveMode === "available_now" || effectiveMode === "visible_now") {
    return {
      canAccess: true,
      isProtected: false,
      visibilityMode: effectiveMode,
      reVerificationRequired: permDoc?.reVerificationRequired || false,
    };
  }

  // Scheduled release check
  if (effectiveMode === "scheduled_release") {
    const now = new Date();
    if (permDoc?.effectiveDate && new Date(permDoc.effectiveDate) <= now) {
      return {
        canAccess: true,
        isProtected: false,
        visibilityMode: effectiveMode,
      };
    }
    return {
      canAccess: false,
      isProtected: true,
      visibilityMode: effectiveMode,
      reason: "This information is scheduled for release on a future date.",
    };
  }

  // Manual release check
  if (effectiveMode === "manual_release") {
    if (permDoc?.isReleased) {
      return {
        canAccess: true,
        isProtected: false,
        visibilityMode: effectiveMode,
      };
    }
    return {
      canAccess: false,
      isProtected: true,
      visibilityMode: effectiveMode,
      reason: "This information is awaiting manual release by the Owner.",
    };
  }

  // Emergency / After death checks (§3, §8)
  const emergencyDoc = await LifeEmergencyAccess.findOne();
  const isEmergencyActive = Boolean(emergencyDoc?.isEmergencyActive);

  if (
    (effectiveMode === "emergency_only" || effectiveMode === "emergency_or_after_death") &&
    isEmergencyActive
  ) {
    // If specific release records exist, verify recordId is in releasedRecordIds
    if (permDoc && !permDoc.isReleased && emergencyDoc?.activeRequestId) {
      // Record released in active emergency or explicitly
      return {
        canAccess: true,
        isProtected: false,
        visibilityMode: effectiveMode,
        reVerificationRequired: permDoc?.reVerificationRequired || false,
      };
    }

    return {
      canAccess: true,
      isProtected: false,
      visibilityMode: effectiveMode,
      reVerificationRequired: permDoc?.reVerificationRequired || false,
    };
  }

  // If locked, return protected state with guideline message (§1, §3)
  return {
    canAccess: false,
    isProtected: true,
    visibilityMode: effectiveMode,
    reason:
      "আপনার জন্য কিছু সুরক্ষিত তথ্য ও নির্দেশনা সংরক্ষিত রয়েছে। নির্ধারিত Emergency অথবা Legacy Verification সম্পন্ন হওয়ার পরে এগুলো দেখা যাবে।",
  };
}
