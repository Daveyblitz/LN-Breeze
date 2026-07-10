import { NextRequest } from "next/server";
import { verifyApiKey, ApiKeyPayload } from "./jwt";

export async function authenticateRequest(req: NextRequest): Promise<ApiKeyPayload | null> {
  const auth = req.headers.get("authorization");

  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7);

  try {
    return await verifyApiKey(token);
  } catch {
    return null;
  }
}
