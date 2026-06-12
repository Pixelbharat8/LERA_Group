import { NextRequest, NextResponse } from "next/server";

/** No-op: legacy client debug hook; do not forward to external ingest hosts. */
export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: true }, { status: 200 });
}
