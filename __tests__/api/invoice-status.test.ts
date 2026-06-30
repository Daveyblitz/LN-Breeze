import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/invoice/status/route";

const LNBITS_URL = "https://demo.lnbits.com";
const INVOICE_KEY = "testinvoicekey123";
const HASH = "paymenthash456";

function makeRequest(hash?: string, headers?: Record<string, string>) {
  const url = new URL(`http://localhost/api/invoice/status${hash ? `?hash=${hash}` : ""}`);
  return new NextRequest(url, { headers: headers ?? {} });
}

function mockLNbits(paid: boolean, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => (ok ? { paid } : { detail: "error" }),
  });
}

beforeEach(() => {
  // Set env vars as fallback credentials
  vi.stubEnv("LNBITS_URL", LNBITS_URL);
  vi.stubEnv("LNBITS_INVOICE_KEY", INVOICE_KEY);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /api/invoice/status", () => {
  it("returns 400 when ?hash is missing", async () => {
    vi.stubGlobal("fetch", mockLNbits(false));
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/hash/i);
  });

  it("returns 400 when no credentials are present", async () => {
    vi.unstubAllEnvs(); // remove env vars
    vi.stubGlobal("fetch", mockLNbits(false));
    const res = await GET(makeRequest(HASH));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/credentials/i);
  });

  it("returns { paid: true } when LNbits says paid", async () => {
    vi.stubGlobal("fetch", mockLNbits(true));
    const res = await GET(makeRequest(HASH));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paid).toBe(true);
  });

  it("returns { paid: false } when LNbits says unpaid", async () => {
    vi.stubGlobal("fetch", mockLNbits(false));
    const res = await GET(makeRequest(HASH));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paid).toBe(false);
  });

  it("returns 500 when LNbits responds with an error status", async () => {
    vi.stubGlobal("fetch", mockLNbits(false, false));
    const res = await GET(makeRequest(HASH));
    expect(res.status).toBe(500);
  });

  it("uses header credentials over env vars", async () => {
    const fetchMock = mockLNbits(true);
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(
      makeRequest(HASH, {
        "x-lnbits-url": "https://custom.lnbits.com",
        "x-lnbits-invoice-key": "customkey999",
      })
    );
    expect(res.status).toBe(200);
    // Verify the custom URL was used, not the env var
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("https://custom.lnbits.com");
    expect(calledUrl).not.toContain("demo.lnbits.com");
  });
});
