import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { lnbitsUrl, walletName } = await req.json();

    if (!lnbitsUrl || !walletName) {
      return NextResponse.json(
        { error: "LNbits URL and wallet name are required" },
        { status: 400 }
      );
    }

    // Generate a random username since LNbits requires one
    const username = `user_${Math.random().toString(36).slice(2, 9)}`;

    const res = await fetch(`${lnbitsUrl}/api/v1/account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, wallet_name: walletName }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail ?? "Failed to create wallet on this LNbits instance" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // LNbits returns the wallet info nested under data.wallets[0]
    const wallet = data.wallets?.[0] ?? data.wallet ?? data;

    return NextResponse.json({
      walletName: wallet.name ?? walletName,
      walletId: wallet.id,
      invoiceKey: wallet.inkey,       // the invoice/read key
      adminKey: wallet.adminkey,      // store but never expose in UI
      lnbitsUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach LNbits — check the URL" },
      { status: 500 }
    );
  }
}
