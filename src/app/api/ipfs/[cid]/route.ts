import { NextRequest, NextResponse } from "next/server";
import { fetchMetadataFromIPFS } from "@/lib/ipfs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ cid: string }> }
) {
  const { cid } = await context.params;
  const metadata = await fetchMetadataFromIPFS(cid);

  if (!metadata) {
    return NextResponse.json(
      { error: `Metadata not found for CID ${cid}` },
      { status: 404 }
    );
  }

  return NextResponse.json(metadata);
}
