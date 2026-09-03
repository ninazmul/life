"use server";

import { connectToDatabase } from "@/lib/database";
import LifeActivityLog from "@/lib/database/models/lifeActivityLog.model";
import { getLifeAuthContext } from "@/lib/life/auth";
import { ILifeActivityLog } from "@/types";

export async function getActivityLogs(params?: {
  resourceType?: string;
  action?: string;
  search?: string;
  limit?: number;
}): Promise<ILifeActivityLog[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const query: Record<string, unknown> = {};

  // Non-owners can only see activity related to their own email
  if (!auth.isOwner && !auth.isAdmin) {
    query.actorEmail = auth.email;
  }

  if (params?.resourceType && params.resourceType !== "all") {
    query.resourceType = params.resourceType;
  }

  if (params?.action && params.action !== "all") {
    query.action = params.action;
  }

  if (params?.search) {
    const regex = new RegExp(params.search.trim(), "i");
    query.$or = [
      { details: regex },
      { actorEmail: regex },
      { actorName: regex },
      { resourceName: regex },
    ];
  }

  const logs = await LifeActivityLog.find(query)
    .sort({ createdAt: -1 })
    .limit(params?.limit || 100)
    .lean();

  return JSON.parse(JSON.stringify(logs));
}
