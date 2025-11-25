import { NextRequest, NextResponse } from "next/server";
import { getAvailableDates } from "@/lib/db/queries";

export const runtime = "nodejs";

/**
 * GET /api/menu/dates?hall=ikenberry
 * Get available dates for a dining hall
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hall = searchParams.get("hall") || "ikenberry";

  try {
    const dates = await getAvailableDates(hall);

    return NextResponse.json({
      success: true,
      hall,
      dates,
    });
  } catch (error) {
    console.error("Error fetching dates:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

