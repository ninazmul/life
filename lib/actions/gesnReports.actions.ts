"use server";

import { IGesnReportsResponse } from "@/types/gesnReports";

export interface FetchGesnReportsParams {
  period?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  category?: string;
  year?: number;
}

/**
 * Server-side proxy action to fetch real-time accounting and transaction data from ACC.GESN.NET
 * Ensures API credentials remain strictly server-side.
 */
export async function getGesnReports(
  params: FetchGesnReportsParams = { period: "thisMonth" }
): Promise<IGesnReportsResponse> {
  const apiUrl =
    process.env.GESN_REPORTS_API_URL || "https://acc.gesn.net/api/reports";
  const apiOwner = process.env.GESN_REPORTS_API_OWNER || "SHOUROV";
  const apiSecretKey =
    process.env.GESN_REPORTS_API_SECRET_KEY ||
    "gsen_live_b7921717618a84b32e1b295ca3e2640a1854962dcd5660de";

  try {
    const url = new URL(apiUrl);

    if (params.period) url.searchParams.set("period", params.period);
    if (params.startDate) url.searchParams.set("startDate", params.startDate);
    if (params.endDate) url.searchParams.set("endDate", params.endDate);
    if (params.type) url.searchParams.set("type", params.type);
    if (params.category) url.searchParams.set("category", params.category);
    if (params.year) url.searchParams.set("year", String(params.year));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-api-owner": apiOwner,
        "x-api-secret-key": apiSecretKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.error) errorMessage = errorJson.error;
      } catch {
        // ignore parse error
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data: IGesnReportsResponse = await response.json();
    return data;
  } catch (err: any) {
    console.error("Error fetching ACC.GESN.NET reports:", err);
    return {
      success: false,
      error:
        err?.message ||
        "Failed to connect to ACC.GESN.NET Reports API. Please verify network connectivity.",
    };
  }
}
