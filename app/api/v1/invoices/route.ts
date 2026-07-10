import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const credentials = await authenticateRequest(req);
  if (!credentials) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  try {
    const { amount, description } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: "amount must be a positive integer (satoshis)" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${credentials.lnbitsUrl}/api/v1/payments`, {
      method: "POST",
      headers: {
        "X-Api-Key": credentials.invoiceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        out: false,
        amount,
        memo: description.trim(),
        expiry: 600,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }

    const data = await res.json();

    return NextResponse.json(
      {
        paymentRequest: data.payment_request,
        paymentHash: data.payment_hash,
        amount,
        description: description.trim(),
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
