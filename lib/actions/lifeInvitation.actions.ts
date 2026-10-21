"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeInvitation from "@/lib/database/models/lifeInvitation.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";

const INVITATION_EXPIRY_DAYS = 7;

/**
 * Sends or creates a time-limited invitation for a LifePerson.
 */
export async function sendPersonInvitation(
  personId: string,
  providedEmail?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, message: "Unauthorized: Only owners or admins can send invitations." };
    }

    const person = await LifePerson.findById(personId);
    if (!person) {
      return { success: false, message: "Person record not found." };
    }

    const email = (providedEmail || person.email || "").toLowerCase().trim();
    if (!email) {
      return { success: false, message: "A valid email address is required to send an invitation." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: "Please provide a valid email address format." };
    }

    // Check if person is already active
    if (person.clerkUserId || person.registrationStatus === "active_user") {
      return { success: false, message: "This person is already an active registered user." };
    }

    // Revoke any existing pending invitations for this person
    await LifeInvitation.updateMany(
      { personId: person._id, status: "pending" },
      { $set: { status: "revoked" } }
    );

    // Generate single-use cryptographically secure invitation token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await LifeInvitation.create({
      personId: person._id,
      ownerEmail: auth.email || "owner@gesn.net",
      email,
      token,
      status: "pending",
      expiresAt,
    });

    // Attempt Clerk invitation if clerkClient is configured
    let clerkInviteCreated = false;
    try {
      const client = await clerkClient();
      const origin = process.env.NEXT_PUBLIC_APP_URL || "https://life.gesn.net";
      await client.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: `${origin}/sign-up?invite_token=${token}`,
      });
      clerkInviteCreated = true;
    } catch (clerkErr: any) {
      // In development or if duplicate invite exists in Clerk, record warning but proceed
      console.warn("Clerk invitation notice:", clerkErr?.message || clerkErr);
    }

    // Update Person record
    person.email = email;
    person.registrationStatus = "invitation_sent";
    person.invitationSentAt = new Date();
    person.invitationExpiresAt = expiresAt;
    person.invitationToken = token;
    await person.save();

    await logLifeActivity({
      action: "INVITE_PERSON",
      resourceType: "people",
      resourceId: String(person._id),
      resourceName: person.name,
      details: `Sent Life VAULT invitation to ${person.name} (${email}). Expires on ${expiresAt.toLocaleDateString()}.`,
    });

    revalidatePath("/people");
    revalidatePath(`/people/${personId}`);

    return {
      success: true,
      message: `Invitation successfully sent to ${email}`,
      data: {
        token,
        expiresAt: expiresAt.toISOString(),
        clerkInviteCreated,
      },
    };
  } catch (err: any) {
    console.error("sendPersonInvitation error:", err);
    return {
      success: false,
      message: err.message || "Failed to send invitation.",
    };
  }
}

/**
 * Resends an invitation for an expired or pending invite.
 */
export async function resendPersonInvitation(
  personId: string
): Promise<{ success: boolean; message: string; data?: any }> {
  return sendPersonInvitation(personId);
}

/**
 * Accepts an invitation using a secure invitation token.
 * Can be called when the invited user signs up or logs into the app.
 */
export async function acceptPersonInvitation(
  token: string
): Promise<{ success: boolean; message: string; personId?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.userId) {
      return { success: false, message: "Authentication required to accept invitation." };
    }

    const invitation = await LifeInvitation.findOne({
      token,
      status: "pending",
    });

    if (!invitation) {
      return { success: false, message: "Invalid or already used invitation token." };
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      invitation.status = "expired";
      await invitation.save();
      await LifePerson.updateOne(
        { _id: invitation.personId },
        { $set: { registrationStatus: "invite_expired" } }
      );
      return { success: false, message: "This invitation has expired. Please ask the owner to resend it." };
    }

    // Verify email match between authenticated user and invitation
    const userEmail = (auth.email || "").toLowerCase().trim();
    const invitedEmail = invitation.email.toLowerCase().trim();
    if (userEmail && userEmail !== invitedEmail) {
      return {
        success: false,
        message: `Mismatched email. This invitation was sent to ${invitedEmail}, but you are signed in as ${userEmail}.`,
      };
    }

    // Mark invitation accepted
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    invitation.acceptedByClerkUserId = auth.userId;
    await invitation.save();

    // Link Person record to verified account
    const person = await LifePerson.findById(invitation.personId);
    if (person) {
      person.clerkUserId = auth.userId;
      person.registrationStatus = "active_user";
      person.accountStatus = "active";
      person.isLoginEnabled = true;
      if (!person.email) person.email = invitedEmail;
      await person.save();
    }

    await logLifeActivity({
      action: "ACCEPT_INVITATION",
      resourceType: "people",
      resourceId: String(invitation.personId),
      resourceName: person?.name || invitedEmail,
      details: `User accepted invitation and linked account to person profile.`,
    });

    revalidatePath("/people");
    if (person) revalidatePath(`/people/${person._id}`);

    return {
      success: true,
      message: "Invitation accepted successfully! Your account is now linked.",
      personId: String(invitation.personId),
    };
  } catch (err: any) {
    console.error("acceptPersonInvitation error:", err);
    return { success: false, message: err.message || "Failed to accept invitation." };
  }
}
