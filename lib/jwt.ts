import { SignJWT, jwtVerify } from "jose";

export interface ApiKeyPayload {
  lnbitsUrl: string;
  invoiceKey: string;
  walletId: string;
  walletName: string;
}

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(s);
}

export async function signApiKey(payload: ApiKeyPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyApiKey(token: string): Promise<ApiKeyPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  const { lnbitsUrl, invoiceKey, walletId, walletName } = payload as Record<string, string>;
  return { lnbitsUrl, invoiceKey, walletId, walletName };
}
