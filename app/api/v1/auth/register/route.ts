import { NextRequest, NextResponse } from "next/server";
import { signApiKey } from "@/lib/jwt";
import { validateLnbitsUrl } from "@/lib/validate-url";

export async function POST(req: NextRequest) {
  try {
    const { lnbitsUrl, invoiceKey, walletId } = await req.json();

    if (!lnbitsUrl || !invoiceKey || !walletId) {
      return NextResponse.json(
        { error: "lnbitsUrl, invoiceKey, and walletId are required" },
        { status: 400 }
      );
    }

    if (!validateLnbitsUrl(lnbitsUrl)) {
      return NextResponse.json(
        { error: "Invalid LNbits URL" },
        { status: 400 }
      );
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

    const wallet = await res.json();

    const apiKey = await signApiKey({
      lnbitsUrl,
      invoiceKey,
      walletId,
      walletName: wallet.name,
    });

    return NextResponse.json({
      apiKey,
      walletName: wallet.name,
      note: "Store this API key securely — it will not be shown again.",
    });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
