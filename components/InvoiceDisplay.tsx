"use client";

import { QRCodeSVG } from "qrcode.react";
import { Invoice } from "@/types/invoice";
import { Copy, Check, Mail, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  invoice: Invoice;
  amount: number;
  description: string;
};

export default function InvoiceDisplay({ invoice, amount, description }: Props) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(invoice.paymentRequest);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendEmail() {
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/invoice/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email.trim(),
          amount,
          description,
          paymentRequest: invoice.paymentRequest,
          paymentHash: invoice.paymentHash,
          expiresAt: invoice.expiresAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to send email"); }
      else { toast.success(`Invoice sent to ${email.trim()}`); setEmail(""); }
    } catch {
      toast.error("Network error — could not send email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass p-5 space-y-4">
      {/* Amount + description summary */}
      <div className="text-center pb-2 border-b border-white/8">
        <p className="text-3xl font-bold text-white">{amount.toLocaleString()} <span className="text-base font-normal text-white/40">sats</span></p>
        <p className="text-sm text-white/50 mt-0.5">{description}</p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center p-4 bg-white rounded-2xl">
        <QRCodeSVG value={invoice.paymentRequest} size={200} level="M" />
      </div>

      {/* BOLT11 truncated */}
      <div className="space-y-1">
        <p className="text-xs text-white/40 uppercase tracking-widest">Payment request (BOLT11)</p>
        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <p className="font-mono text-xs text-white/50 break-all"> 
            {invoice.paymentRequest.slice(0, 10)}...{invoice.paymentRequest.slice(-6)}
          </p>
        </div>
        <p className="text-xs text-white/25">Copy button below copies the full string</p>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/12 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-sm font-medium transition-all"
      >
        {copied ? (
          <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></>
        ) : (
          <><Copy className="w-4 h-4" />Copy payment request</>
        )}
      </button>

      {/* Email section */}
      <div className="space-y-2 pt-1 border-t border-white/8">
        <label className="flex items-center gap-1.5 text-xs text-white/40 uppercase tracking-widest">
          <Mail className="w-3 h-3" />
          Send to customer (optional)
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="customer@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending}
            onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
            className="glass-input flex-1 px-3 py-2 text-sm rounded-lg"
          />
          <button
            onClick={handleSendEmail}
            disabled={!email.trim() || sending}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/12 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-40 transition-all"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
