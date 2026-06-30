"use client";

import { useEffect, useRef, useState } from "react";
import { Invoice, InvoiceStatus } from "@/types/invoice";
import { InvoiceWebSocket } from "@/lib/websocket";
import { usePolling } from "@/lib/polling";
import { CheckCircle, Clock, XCircle, Loader2, Zap } from "lucide-react";

type Props = {
  invoice: Invoice;
  wsUrl: string;
  onPaid: () => void;
  onReset: () => void;
};

export default function PaymentStatus({ invoice, wsUrl, onPaid, onReset }: Props) {
  const [status, setStatus] = useState<InvoiceStatus>("unpaid");
  const [wsConnected, setWsConnected] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((invoice.expiresAt - Date.now()) / 1000))
  );
  const wsRef = useRef<InvoiceWebSocket | null>(null);
  const settledRef = useRef(false);

  function handleSettled() {
    if (settledRef.current) return;
    settledRef.current = true;
    setStatus("paid");
    onPaid();
  }

  useEffect(() => {
    const ws = new InvoiceWebSocket();
    wsRef.current = ws;
    ws.connect(wsUrl, invoice.paymentHash, handleSettled, setWsConnected);
    return () => ws.disconnect();
  }, [wsUrl, invoice.paymentHash]);

  usePolling(invoice.paymentHash, {
    enabled: !wsConnected && status === "unpaid",
    onPaid: handleSettled,
  });

  useEffect(() => {
    if (status !== "unpaid") return;
    const id = setInterval(() => {
      const secs = Math.max(0, Math.floor((invoice.expiresAt - Date.now()) / 1000));
      setSecondsLeft(secs);
      if (secs === 0) setStatus("expired");
    }, 1000);
    return () => clearInterval(id);
  }, [status, invoice.expiresAt]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes}:${String(seconds).padStart(2, "0")}`;

  if (status === "paid") {
    return (
      <div className="glass p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-green-400">Payment received!</h2>
          <p className="text-sm text-white/40 mt-1">Your Lightning invoice has been paid successfully.</p>
        </div>
        <button
          onClick={onReset}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Zap className="w-4 h-4" />
          Generate new invoice
        </button>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="glass p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-red-400">Invoice expired</h2>
          <p className="text-sm text-white/40 mt-1">This invoice was not paid within 10 minutes.</p>
        </div>
        <button
          onClick={onReset}
          className="w-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 font-medium py-2.5 rounded-xl transition-colors text-sm"
        >
          Generate new invoice
        </button>
      </div>
    );
  }

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
          <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
          <span className="text-xs font-medium text-yellow-400">Awaiting payment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-green-400" : "bg-white/20"}`} />
          <span className="text-xs text-white/30">{wsConnected ? "Live" : "Polling"}</span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2 text-white/40">
          <Clock className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Expires in</span>
        </div>
        <p className="text-4xl font-bold text-white font-mono tracking-tight">{timeDisplay}</p>
      </div>

      {/* DEV ONLY — remove before final demo */}
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={handleSettled}
          className="mt-4 w-full border border-dashed border-white/15 bg-transparent hover:bg-white/5 text-white/30 hover:text-white/60 text-xs py-2 rounded-lg transition-all"
        >
          [Dev] Simulate payment
        </button>
      )}
    </div>
  );
}
