type OnSettledFn = () => void;
type OnStatusChangeFn = (connected: boolean) => void;

export class InvoiceWebSocket {
  private ws: WebSocket | null = null;
  private paymentHash: string = "";
  private backoffMs: number = 1000;
  private stopped: boolean = false;
  private onSettled: OnSettledFn = () => {};
  private onStatusChange: OnStatusChangeFn = () => {};

  connect(
    wsUrl: string,
    paymentHash: string,
    onSettled: OnSettledFn,
    onStatusChange: OnStatusChangeFn
  ) {
    this.paymentHash = paymentHash;
    this.onSettled = onSettled;
    this.onStatusChange = onStatusChange;
    this.stopped = false;
    this.backoffMs = 1000;
    this.open(wsUrl);
  }

  private open(wsUrl: string) {
    if (this.stopped) return;

    try {
      this.ws = new WebSocket(wsUrl);
    } catch {
      this.scheduleReconnect(wsUrl);
      return;
    }

    this.ws.onopen = () => {
      this.backoffMs = 1000;
      this.onStatusChange(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // LNbits sends payment hash in different shapes depending on version
        const hash =
          data.payment_hash ??
          data.payment?.payment_hash ??
          data.checking_id;
        if (hash === this.paymentHash) {
          this.onSettled();
          this.disconnect();
        }
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.onStatusChange(false);
      this.scheduleReconnect(wsUrl);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect(wsUrl: string) {
    if (this.stopped) return;
    setTimeout(() => this.open(wsUrl), this.backoffMs);
    this.backoffMs = Math.min(this.backoffMs * 2, 30_000);
  }

  disconnect() {
    this.stopped = true;
    this.ws?.close();
    this.ws = null;
  }
}
