import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const lnbitsUrl = req.headers.get("x-lnbits-url") ?? process.env.LNBITS_URL;
    const invoiceKey = req.headers.get("x-lnbits-invoice-key") ?? process.env.LNBITS_INVOICE_KEY;
    const walletId = req.headers.get("x-lnbits-wallet-id") ?? process.env.LNBITS_WALLET_ID;

    if (!lnbitsUrl || !invoiceKey || !walletId) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const res = await fetch(`${lnbitsUrl}/api/v1/wallet`, {
      headers: { "X-Api-Key": invoiceKey },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Invalid credentials or could not reach LNbits" },
        { status: 401 }
      );
    }

    const data = await res.json();
    const wsUrl = `wss://${new URL(lnbitsUrl).host}/api/v1/ws/${walletId}`;

    return NextResponse.json({ name: data.name, balance: data.balance, wsUrl });
  } catch {
    return NextResponse.json({ error: "Failed to connect to LNbits" }, { status: 500 });
  }
}
