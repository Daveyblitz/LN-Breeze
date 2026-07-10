import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const credentials = await authenticateRequest(req);
  if (!credentials) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  const { hash } = await params;

  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
    return NextResponse.json(
      { error: "Invalid payment hash — must be a 64-character hex string" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${credentials.lnbitsUrl}/api/v1/payments/${hash}`,
      {
        headers: { "X-Api-Key": credentials.invoiceKey },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const data = await res.json();

    return NextResponse.json({ paymentHash: hash, paid: data.paid });
  } catch {
    return NextResponse.json({ error: "Failed to check invoice status" }, { status: 500 });
  }
}
