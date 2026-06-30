import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const lnbitsUrl = req.headers.get("x-lnbits-url") ?? process.env.LNBITS_URL;
    const invoiceKey = req.headers.get("x-lnbits-invoice-key") ?? process.env.LNBITS_INVOICE_KEY;

    if (!lnbitsUrl || !invoiceKey) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const hash = req.nextUrl.searchParams.get("hash");
    if (!hash) {
      return NextResponse.json({ error: "Missing payment hash" }, { status: 400 });
    }

    const res = await fetch(`${lnbitsUrl}/api/v1/payments/${hash}`, {
      headers: { "X-Api-Key": invoiceKey },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: `LNbits error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ paid: data.paid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to check status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
