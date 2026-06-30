export type InvoiceStatus = "idle" | "unpaid" | "paid" | "expired";

export type Invoice = {
  paymentRequest: string; // the BOLT11 string (lnbc...)
  paymentHash: string;    // unique ID used to track payment
  expiresAt: number;      // unix timestamp in milliseconds
};
