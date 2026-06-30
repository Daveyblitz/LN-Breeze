import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const lnbitsUrl = req.headers.get("x-lnbits-url") ?? process.env.LNBITS_URL;
    const invoiceKey = req.headers.get("x-lnbits-invoice-key") ?? process.env.LNBITS_INVOICE_KEY;

    if (!lnbitsUrl || !invoiceKey) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const body = await req.json();
    const { amount, description } = body;

    if (!amount || typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: "Amount must be a positive whole number of satoshis" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || description.trim() === "") {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const res = await fetch(`${lnbitsUrl}/api/v1/payments`, {
      method: "POST",
      headers: {
        "X-Api-Key": invoiceKey,
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
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail ?? `LNbits error: ${res.status}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      paymentRequest: data.payment_request,
      paymentHash: data.payment_hash,
      expiresAt: Date.now() + 600 * 1000,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
