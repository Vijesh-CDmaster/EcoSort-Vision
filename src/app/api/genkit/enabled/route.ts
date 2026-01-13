import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const enabled = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  return NextResponse.json({ enabled });
}
