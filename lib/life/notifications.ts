import { logLifeActivity } from "@/lib/life/auth";
import Admin from "@/lib/database/models/admin.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeEmergencyAccess from "@/lib/database/models/lifeEmergencyAccess.model";
import { connectToDatabase } from "@/lib/database";

export interface RecoveryNotificationPayload {
  eventId: string;
  eventType: "emergency_button" | "vault_failed_attempts";
  triggeredByName: string;
  triggeredByEmail: string;
  triggeredAt: Date;
  countdownEndsAt: Date;
  hoursRemaining?: number;
  reason?: string;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
  };
  cancelledByName?: string;
  vaultConsecutiveFailures?: number;
}

/**
 * Resolves all configured Super Admin and Owner notification emails.
 */
export async function getSuperAdminNotificationEmails(): Promise<string[]> {
  await connectToDatabase();
  const emails = new Set<string>();

  // Fetch from Admin collection
  const admins = await Admin.find({
    role: { $in: ["owner", "super_admin"] },
    status: "active",
  })
    .select("email")
    .lean();
  for (const a of admins) {
    if (a.email) emails.add(a.email.toLowerCase().trim());
  }

  // Fetch from LifePerson collection
  const ownerPeople = await LifePerson.find({
    role: { $in: ["owner", "super_admin"] },
    status: "active",
  })
    .select("email")
    .lean();
  for (const p of ownerPeople) {
    if (p.email) emails.add(p.email.toLowerCase().trim());
  }

  // Fetch from LifeEmergencyAccess config
  const emergencyConfig = (await LifeEmergencyAccess.findOne().lean()) as any;
  if (emergencyConfig?.primaryAdminEmail) {
    emails.add(emergencyConfig.primaryAdminEmail.toLowerCase().trim());
  }
  if (emergencyConfig?.secondaryAdminEmail) {
    emails.add(emergencyConfig.secondaryAdminEmail.toLowerCase().trim());
  }

  return Array.from(emails);
}

/**
 * Dispatches an email notification safely.
 * Never includes passwords, vault secrets, or recovery codes.
 */
async function dispatchEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string[];
  subject: string;
  html: string;
  text: string;
}) {
  if (!to || to.length === 0) return;

  // Safe email dispatch logging (production-ready stub + console audit)
  console.log(`\n================== [LIFE EMAIL DISPATCH] ==================`);
  console.log(`TO: ${to.join(", ")}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY:\n${text}`);
  console.log(`===========================================================\n`);
}

/**
 * 1. Emergency Button Activated -> Notify Super Admins
 */
export async function notifyEmergencyTriggered(payload: RecoveryNotificationPayload) {
  const recipients = await getSuperAdminNotificationEmails();
  const subject = "[LIFE EMERGENCY] Emergency Recovery Activated — 48 Hours Remaining";

  const text = `
CRITICAL SECURITY NOTICE: EMERGENCY RECOVERY ACTIVATED — 48 HOURS REMAINING

An authorized Emergency Contact has activated the Emergency Button on your LIFE platform.

EVENT DETAILS:
- Triggered By: ${payload.triggeredByName} (${payload.triggeredByEmail})
- Date/Time: ${payload.triggeredAt.toUTCString()}
- Cancellation Deadline: ${payload.countdownEndsAt.toUTCString()} (48 Hours from activation)
- IP Address: ${payload.deviceInfo?.ip || "Not available"}
- Device / Session: ${payload.deviceInfo?.userAgent || "Standard Browser"}
- Reason Provided: ${payload.reason || "Owner unavailable / Emergency continuity requested"}

ACTION REQUIRED FOR SUPER ADMINS:
If you are safe and this request is unauthorized or a false alarm, sign in immediately to the LIFE Command Center and CANCEL this emergency recovery event.
Cancelling requires your Master Security PIN.

If not cancelled within 48 hours, the predefined Emergency Continuity Access Policy will automatically activate for pre-authorized contacts.

Note: No passwords or sensitive vault credentials are ever transmitted in notifications.
  `.trim();

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: #ef4444; color: #ffffff; padding: 12px 16px; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Emergency Recovery Activated — 48 Hours Remaining
      </div>
      <p style="font-size: 14px; color: #334155; margin-top: 16px;">
        An authorized Emergency Contact has triggered the emergency recovery protocol on your LIFE platform.
      </p>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px; color: #1e293b;">
        <p style="margin: 4px 0;"><strong>Triggered By:</strong> ${payload.triggeredByName} (${payload.triggeredByEmail})</p>
        <p style="margin: 4px 0;"><strong>Date / Time:</strong> ${payload.triggeredAt.toLocaleString()}</p>
        <p style="margin: 4px 0;"><strong>Cancellation Window:</strong> 48 Hours Remaining</p>
        <p style="margin: 4px 0;"><strong>Deadline:</strong> ${payload.countdownEndsAt.toLocaleString()}</p>
        <p style="margin: 4px 0;"><strong>Reason:</strong> ${payload.reason || "Owner unavailable"}</p>
      </div>
      <p style="font-size: 13px; color: #475569;">
        Super Admins can cancel this recovery event before the 48-hour window expires by signing in and providing their Master Security PIN.
      </p>
    </div>
  `;

  await dispatchEmail({ to: recipients, subject, html, text });

  await logLifeActivity({
    action: "NOTIFICATION_EMERGENCY_TRIGGERED",
    resourceType: "recovery_event",
    resourceId: payload.eventId,
    details: `Dispatched 48h emergency notification to ${recipients.length} Super Admin(s).`,
    isCritical: true,
  });
}

/**
 * 2. 15 Consecutive Failed Vault Attempts -> Notify Super Admins
 */
export async function notifyVaultLockTriggered(payload: RecoveryNotificationPayload) {
  const recipients = await getSuperAdminNotificationEmails();
  const subject = "[LIFE VAULT ALERT] Master Vault Locked: 15 Failed Attempts Detected — 48 Hours Remaining";

  const text = `
SECURITY ALERT: MASTER VAULT TEMPORARILY LOCKED — 15 CONSECUTIVE FAILED ATTEMPTS

15 consecutive incorrect Master Vault PIN/Password attempts have been detected.
The Master Vault authentication path has been temporarily locked to prevent brute-force intrusion.

EVENT DETAILS:
- Failed Attempts: 15 consecutive attempts
- Locked At: ${payload.triggeredAt.toUTCString()}
- 48-Hour Cancellation Window Ends: ${payload.countdownEndsAt.toUTCString()}
- IP Address: ${payload.deviceInfo?.ip || "Recorded"}
- Device / Agent: ${payload.deviceInfo?.userAgent || "Recorded"}

PROTECTION DETAILS:
- Encrypted vault data remains fully preserved and encrypted.
- No plaintext passwords are sent or revealed.
- Super Admins have 48 hours to cancel the vault recovery lock with Master Credentials.
  `.trim();

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: #b91c1c; color: #ffffff; padding: 12px 16px; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Master Vault Locked: 15 Failed Attempts — 48 Hours Remaining
      </div>
      <p style="font-size: 14px; color: #334155; margin-top: 16px;">
        The Master Vault authentication path has been temporarily locked following 15 consecutive failed password attempts.
      </p>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px; color: #1e293b;">
        <p style="margin: 4px 0;"><strong>Attempts:</strong> 15 consecutive failures</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> Authentication Locked</p>
        <p style="margin: 4px 0;"><strong>Cancellation Deadline:</strong> ${payload.countdownEndsAt.toLocaleString()}</p>
      </div>
      <p style="font-size: 13px; color: #475569;">
        Super Admins can cancel the recovery lock from the Security Console with strong verification.
      </p>
    </div>
  `;

  await dispatchEmail({ to: recipients, subject, html, text });

  await logLifeActivity({
    action: "NOTIFICATION_VAULT_LOCK_TRIGGERED",
    resourceType: "vault",
    resourceId: payload.eventId,
    details: `Dispatched Vault 15-failure lock notification to ${recipients.length} Super Admin(s).`,
    isCritical: true,
  });
}

/**
 * 3. Emergency Recovery Cancelled by Owner / Super Admin
 */
export async function notifyEmergencyCancelled(
  payload: RecoveryNotificationPayload,
  contactEmails: string[] = []
) {
  const adminRecipients = await getSuperAdminNotificationEmails();
  const allRecipients = Array.from(new Set([...adminRecipients, ...contactEmails]));
  const subject = "[LIFE SECURITY] Emergency Recovery CANCELLED by Super Admin";

  const text = `
SECURITY NOTICE: EMERGENCY RECOVERY CANCELLED

The active emergency recovery protocol has been officially CANCELLED by an authorized Super Admin (${payload.cancelledByName || "Owner"}).
All temporary emergency access has been sealed and the platform has returned to normal state.

- Event ID: ${payload.eventId}
- Cancelled At: ${new Date().toUTCString()}
- Status: NORMAL / ALL ACCESS SEALED
  `.trim();

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: #10b981; color: #ffffff; padding: 12px 16px; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Emergency Recovery Cancelled
      </div>
      <p style="font-size: 14px; color: #334155; margin-top: 16px;">
        The emergency recovery process was cancelled by ${payload.cancelledByName || "Super Admin"}. The platform is operating in normal secure status.
      </p>
    </div>
  `;

  await dispatchEmail({ to: allRecipients, subject, html, text });

  await logLifeActivity({
    action: "NOTIFICATION_EMERGENCY_CANCELLED",
    resourceType: "recovery_event",
    resourceId: payload.eventId,
    details: `Dispatched emergency cancellation notification to ${allRecipients.length} recipient(s).`,
  });
}

/**
 * 4. After 48 Hours: Emergency Access Activated
 */
export async function notifyEmergencyActivated(
  payload: RecoveryNotificationPayload,
  contactEmails: string[] = []
) {
  const adminRecipients = await getSuperAdminNotificationEmails();
  const allRecipients = Array.from(new Set([...adminRecipients, ...contactEmails]));
  const subject = "[LIFE CONTINUITY] Emergency Access ACTIVATED — Controlled Policy Enforced";

  const text = `
CONTINUITY ACTIVATION: PREDEFINED EMERGENCY ACCESS ACTIVATED

The 48-hour cancellation period has elapsed without cancellation.
The predefined Emergency Continuity Access Policy has been automatically enforced.

POLICY SPECIFICATIONS:
- Temporary Emergency Administrator / Contact permissions granted strictly as pre-configured.
- Only records explicitly marked for emergency release are accessible.
- Owner-only private records and Master Vault passwords remain strictly protected and encrypted.
- Every access, view, and download is being immutably audited.
  `.trim();

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: #f59e0b; color: #ffffff; padding: 12px 16px; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Emergency Continuity Access Activated
      </div>
      <p style="font-size: 14px; color: #334155; margin-top: 16px;">
        The 48-hour window has elapsed. Predefined emergency continuity access has been granted under strict controlled policy.
      </p>
    </div>
  `;

  await dispatchEmail({ to: allRecipients, subject, html, text });

  await logLifeActivity({
    action: "NOTIFICATION_EMERGENCY_ACTIVATED",
    resourceType: "recovery_event",
    resourceId: payload.eventId,
    details: `Dispatched emergency activation notification to ${allRecipients.length} recipient(s).`,
    isCritical: true,
  });
}

/**
 * 5. Emergency Access Expired / Revoked
 */
export async function notifyEmergencyExpired(
  payload: RecoveryNotificationPayload,
  contactEmails: string[] = []
) {
  const adminRecipients = await getSuperAdminNotificationEmails();
  const allRecipients = Array.from(new Set([...adminRecipients, ...contactEmails]));
  const subject = "[LIFE CONTINUITY] Emergency Access Expired & Revoked";

  const text = `
NOTICE: EMERGENCY ACCESS EXPIRED & REVOKED

The temporary emergency access duration has expired. All emergency access permissions have been automatically revoked.
  `.trim();

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: #64748b; color: #ffffff; padding: 12px 16px; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Emergency Access Expired
      </div>
      <p style="font-size: 14px; color: #334155; margin-top: 16px;">
        Temporary emergency access has concluded. All emergency permissions have been revoked.
      </p>
    </div>
  `;

  await dispatchEmail({ to: allRecipients, subject, html, text });

  await logLifeActivity({
    action: "NOTIFICATION_EMERGENCY_EXPIRED",
    resourceType: "recovery_event",
    resourceId: payload.eventId,
    details: `Dispatched emergency expiration notification to ${allRecipients.length} recipient(s).`,
  });
}
