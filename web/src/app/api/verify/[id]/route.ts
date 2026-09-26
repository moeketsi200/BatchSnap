import { NextRequest, NextResponse } from "next/server";
import {
  reportBatchTamper,
  verifyAndClaimBatch,
  verifyBatchReadOnly,
} from "@/lib/batch-service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const batchId = Number(id);
    if (!Number.isFinite(batchId) || batchId <= 0) {
      return NextResponse.json({ error: "Invalid batchId" }, { status: 400 });
    }

    const secret = req.nextUrl.searchParams.get("secret") || "";
    const autoClaim = req.nextUrl.searchParams.get("claim") === "true";

    const result = autoClaim
      ? await verifyAndClaimBatch(batchId, secret)
      : await verifyBatchReadOnly(batchId, secret);

    const statusHttp = result.status === "BATCH_NOT_FOUND" ? 404 : 200;
    return NextResponse.json(result, { status: statusHttp });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Verification check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const batchId = Number(id);
    if (!Number.isFinite(batchId) || batchId <= 0) {
      return NextResponse.json({ error: "Invalid batchId" }, { status: 400 });
    }

    const body = (await req.json()) as {
      secret?: string;
      action?: "claim" | "report_tamper";
      locationInfo?: string;
    };

    if (body.action === "report_tamper") {
      const report = await reportBatchTamper(
        batchId,
        body.locationInfo || "Unspecified retail location"
      );
      return NextResponse.json(report);
    }

    const result = await verifyAndClaimBatch(batchId, body.secret || "");
    const statusHttp = result.status === "BATCH_NOT_FOUND" ? 404 : 200;
    return NextResponse.json(result, { status: statusHttp });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Verification claim failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
