"use client";

import { useState } from "react";
import { parseSats } from "@/lib/math";
import { Invoice } from "@/types/invoice";
import { Zap, Loader2 } from "lucide-react";

type Props = {
  onInvoiceCreated: (invoice: Invoice, amount: number, description: string) => void;
  credentialHeaders: HeadersInit;
};

export default function InvoiceForm({ onInvoiceCreated, credentialHeaders }: Props) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let sats: number;
    try {
      sats = parseSats(amount);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid amount");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/invoice/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...credentialHeaders },
        body: JSON.stringify({ amount: sats, description: description.trim() }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create invoice"); return; }

      onInvoiceCreated(data as Invoice, sats, description.trim());
      setAmount("");
      setDescription("");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-yellow-400/15 flex items-center justify-center">
          <Zap className="w-4 h-4 text-yellow-400" />
        </div>
        <h2 className="text-base font-semibold text-white">Generate invoice</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-white/40 uppercase tracking-widest">Amount (satoshis)</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            className="glass-input w-full px-3 py-2.5 text-sm rounded-lg"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/40 uppercase tracking-widest">Description</label>
          <textarea
            placeholder="e.g. Coffee payment"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={2}
            className="glass-input w-full px-3 py-2.5 text-sm rounded-lg resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
          ) : (
            <><Zap className="w-4 h-4" />Generate invoice</>
          )}
        </button>
      </form>
    </div>
  );
}
