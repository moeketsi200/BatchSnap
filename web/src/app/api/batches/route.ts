import { NextRequest, NextResponse } from "next/server";
import { createAndAnchorBatch, listBatches } from "@/lib/batch-service";
import type { CreateBatchRequest } from "@/lib/types";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const producer = req.nextUrl.searchParams.get("producer") || undefined;
    const batches = await listBatches(producer);
    return NextResponse.json({ batches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list batches";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateBatchRequest;
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const created = await createAndAnchorBatch(body, baseUrl);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create and anchor batch";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
