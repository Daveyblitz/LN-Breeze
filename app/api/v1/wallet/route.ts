import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const credentials = await authenticateRequest(req);
  if (!credentials) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${credentials.lnbitsUrl}/api/v1/wallet`, {
      headers: { "X-Api-Key": credentials.invoiceKey },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to reach wallet" }, { status: 500 });
    }

    const data = await res.json();

    return NextResponse.json({
      name: data.name,
      balance: data.balance,
      walletId: credentials.walletId,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 });
  }
}
