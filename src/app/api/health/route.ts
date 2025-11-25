import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const runtime = "nodejs";

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; message?: string }> = {
    api: { status: "ok" },
    database: { status: "error", message: "Not checked" },
    openai: { status: "error", message: "Not checked" },
  };

  // Check database connection
  try {
    if (process.env.POSTGRES_URL) {
      await sql`SELECT 1`;
      checks.database = { status: "ok" };
    } else {
      checks.database = { status: "error", message: "POSTGRES_URL not configured" };
    }
  } catch (error) {
    checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }

  // Check OpenAI API key
  if (process.env.OPENAI_API_KEY) {
    checks.openai = { status: "ok" };
  } else {
    checks.openai = { status: "error", message: "OPENAI_API_KEY not configured" };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}

