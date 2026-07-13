import { NextRequest, NextResponse } from "next/server";

const LNBITS_URL = "https://demo.lnbits.com";

export async function POST(req: NextRequest) {
  try {
    const { walletName } = await req.json();

    if (!walletName) {
      return NextResponse.json(
        { error: "walletName is required" },
        { status: 400 }
      );
    }

    const username = `user_${Math.random().toString(36).slice(2, 9)}`;

    const res = await fetch(`${LNBITS_URL}/api/v1/account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, wallet_name: walletName }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail ?? "Failed to create wallet" },
        { status: 400 }
      );
    }

    const data = await res.json();
    const wallet = data.wallets?.[0] ?? data.wallet ?? data;

    return NextResponse.json(
      {
        walletId: wallet.id,
        invoiceKey: wallet.inkey,
        walletName: wallet.name ?? walletName,
        lnbitsUrl: LNBITS_URL,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach LNbits" },
      { status: 500 }
    );
  }
}
