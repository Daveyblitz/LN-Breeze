import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePolling } from "@/lib/polling";

const HASH = "testhash999";

function mockFetch(paid: boolean) {
  return vi.fn().mockResolvedValue({
    json: async () => ({ paid }),
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("usePolling", () => {
  it("does not fetch when enabled is false", async () => {
    const fetchMock = mockFetch(false);
    vi.stubGlobal("fetch", fetchMock);
    renderHook(() => usePolling(HASH, { enabled: false, onPaid: vi.fn() }));
    await vi.advanceTimersByTimeAsync(9000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not fetch when paymentHash is null", async () => {
    const fetchMock = mockFetch(false);
    vi.stubGlobal("fetch", fetchMock);
    renderHook(() => usePolling(null, { enabled: true, onPaid: vi.fn() }));
    await vi.advanceTimersByTimeAsync(9000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches the correct status URL at each interval", async () => {
    const fetchMock = mockFetch(false);
    vi.stubGlobal("fetch", fetchMock);
    renderHook(() => usePolling(HASH, { enabled: true, intervalMs: 3000, onPaid: vi.fn() }));
    await vi.advanceTimersByTimeAsync(9000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith(`/api/invoice/status?hash=${HASH}`);
  });

  it("calls onPaid when response is paid: true", async () => {
    const fetchMock = mockFetch(true);
    vi.stubGlobal("fetch", fetchMock);
    const onPaid = vi.fn();
    renderHook(() => usePolling(HASH, { enabled: true, intervalMs: 3000, onPaid }));
    await vi.advanceTimersByTimeAsync(3000);
    expect(onPaid).toHaveBeenCalledOnce();
  });

  it("stops polling after onPaid fires", async () => {
    const fetchMock = mockFetch(true);
    vi.stubGlobal("fetch", fetchMock);
    const onPaid = vi.fn();
    renderHook(() => usePolling(HASH, { enabled: true, intervalMs: 3000, onPaid }));
    await vi.advanceTimersByTimeAsync(12000);
    // Should only have called fetch once — poll stopped after payment
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not call onPaid when response is paid: false and keeps polling", async () => {
    const fetchMock = mockFetch(false);
    vi.stubGlobal("fetch", fetchMock);
    const onPaid = vi.fn();
    renderHook(() => usePolling(HASH, { enabled: true, intervalMs: 3000, onPaid }));
    await vi.advanceTimersByTimeAsync(9000);
    expect(onPaid).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("swallows network errors and keeps polling", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    const onPaid = vi.fn();
    renderHook(() => usePolling(HASH, { enabled: true, intervalMs: 3000, onPaid }));
    await expect(vi.advanceTimersByTimeAsync(6000)).resolves.not.toThrow();
    expect(onPaid).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("clears the interval on unmount", async () => {
    const fetchMock = mockFetch(false);
    vi.stubGlobal("fetch", fetchMock);
    const { unmount } = renderHook(() =>
      usePolling(HASH, { enabled: true, intervalMs: 3000, onPaid: vi.fn() })
    );
    await vi.advanceTimersByTimeAsync(3000);
    unmount();
    await vi.advanceTimersByTimeAsync(9000);
    // Only 1 call before unmount, none after
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
