const LNBITS_URL = process.env.LNBITS_URL!;
const LNBITS_INVOICE_KEY = process.env.LNBITS_INVOICE_KEY!;

function headers() {
  return {
    "X-Api-Key": LNBITS_INVOICE_KEY,
    "Content-Type": "application/json",
  };
}

// Confirms credentials are valid and returns wallet balance
export async function getWalletInfo() {
  const res = await fetch(`${LNBITS_URL}/api/v1/wallet`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`LNbits error: ${res.status}`);
  return res.json() as Promise<{ name: string; balance: number }>;
}

// Creates a new Lightning invoice and returns the BOLT11 string + payment hash
export async function createInvoice(amountSat: number, memo: string) {
  const res = await fetch(`${LNBITS_URL}/api/v1/payments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      out: false,
      amount: amountSat,
      memo,
      expiry: 600, // 10 minutes
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `LNbits error: ${res.status}`);
  }
  const data = await res.json();
  return {
    paymentRequest: data.payment_request as string, // the BOLT11 string
    paymentHash: data.payment_hash as string,       // unique ID for this invoice
    expiresAt: Date.now() + 600 * 1000,             // 10 min from now
  };
}

// Checks whether a specific invoice has been paid
export async function checkInvoiceStatus(paymentHash: string) {
  const res = await fetch(`${LNBITS_URL}/api/v1/payments/${paymentHash}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`LNbits error: ${res.status}`);
  const data = await res.json();
  return { paid: data.paid as boolean };
}
