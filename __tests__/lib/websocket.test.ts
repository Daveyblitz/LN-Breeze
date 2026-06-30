import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InvoiceWebSocket } from "@/lib/websocket";

// Controllable fake WebSocket
class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn(() => { this.onclose?.(); });

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  // Helper: trigger open
  open() { this.onopen?.(); }
  // Helper: trigger a message
  send(data: object) { this.onmessage?.({ data: JSON.stringify(data) }); }
}

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeWebSocket);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const TARGET_HASH = "abc123paymenthash";
const WS_URL = "wss://demo.lnbits.com/api/v1/ws/wallet123";

function makeWS() {
  const onSettled = vi.fn();
  const onStatusChange = vi.fn();
  const iws = new InvoiceWebSocket();
  iws.connect(WS_URL, TARGET_HASH, onSettled, onStatusChange);
  const fakeWs = FakeWebSocket.instances[0];
  return { iws, onSettled, onStatusChange, fakeWs };
}

describe("InvoiceWebSocket", () => {
  it("calls onStatusChange(true) when connection opens", () => {
    const { onStatusChange, fakeWs } = makeWS();
    fakeWs.open();
    expect(onStatusChange).toHaveBeenCalledWith(true);
  });

  it("calls onStatusChange(false) when connection closes", () => {
    const { onStatusChange, fakeWs } = makeWS();
    fakeWs.open();
    fakeWs.onclose?.();
    expect(onStatusChange).toHaveBeenCalledWith(false);
  });

  it("calls onSettled when message contains matching payment_hash", () => {
    const { onSettled, fakeWs } = makeWS();
    fakeWs.open();
    fakeWs.send({ payment_hash: TARGET_HASH });
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("calls onSettled when message contains matching payment.payment_hash", () => {
    const { onSettled, fakeWs } = makeWS();
    fakeWs.open();
    fakeWs.send({ payment: { payment_hash: TARGET_HASH } });
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("calls onSettled when message contains matching checking_id", () => {
    const { onSettled, fakeWs } = makeWS();
    fakeWs.open();
    fakeWs.send({ checking_id: TARGET_HASH });
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("does NOT call onSettled for a different payment hash", () => {
    const { onSettled, fakeWs } = makeWS();
    fakeWs.open();
    fakeWs.send({ payment_hash: "different_hash_xyz" });
    expect(onSettled).not.toHaveBeenCalled();
  });

  it("calls ws.close() after onSettled fires", () => {
    const { fakeWs } = makeWS();
    fakeWs.open();
    fakeWs.send({ payment_hash: TARGET_HASH });
    expect(fakeWs.close).toHaveBeenCalled();
  });

  it("schedules a reconnect (setTimeout) when connection closes", () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const { fakeWs } = makeWS();
    fakeWs.open();
    fakeWs.onclose?.();
    expect(setTimeoutSpy).toHaveBeenCalled();
  });

  it("does NOT reconnect after disconnect() is called", () => {
    const { iws, fakeWs } = makeWS();
    fakeWs.open();
    iws.disconnect();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    fakeWs.onclose?.();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it("ignores malformed (non-JSON) messages without crashing", () => {
    const { onSettled, fakeWs } = makeWS();
    fakeWs.open();
    expect(() => {
      fakeWs.onmessage?.({ data: "not json {{" });
    }).not.toThrow();
    expect(onSettled).not.toHaveBeenCalled();
  });
});
