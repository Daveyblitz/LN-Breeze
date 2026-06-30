"use client";

import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import ConnectionScreen, { WalletCredentials } from "@/components/ConnectionScreen";
import InvoiceForm from "@/components/InvoiceForm";
import InvoiceDisplay from "@/components/InvoiceDisplay";
import PaymentStatus from "@/components/PaymentStatus";
import { Invoice } from "@/types/invoice";
import { Zap } from "lucide-react";

export default function Home() {
  const [credentials, setCredentials] = useState<WalletCredentials | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceMeta, setInvoiceMeta] = useState<{ amount: number; description: string } | null>(null);
  const [paid, setPaid] = useState(false);

  function credentialHeaders(): HeadersInit {
    if (!credentials) return {};
    return {
      "x-lnbits-url": credentials.lnbitsUrl,
      "x-lnbits-invoice-key": credentials.invoiceKey,
      "x-lnbits-wallet-id": credentials.walletId,
    };
  }

  function handleInvoiceCreated(newInvoice: Invoice, amount: number, description: string) {
    setPaid(false);
    setInvoice(newInvoice);
    setInvoiceMeta({ amount, description });
  }

  function handleReset() {
    setInvoice(null);
    setInvoiceMeta(null);
    setPaid(false);
  }

  function handleDisconnect() {
    setCredentials(null);
    setInvoice(null);
    setInvoiceMeta(null);
    setPaid(false);
  }

  if (!credentials) {
    return <ConnectionScreen onConnected={setCredentials} />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-6">
      <Toaster />
      <div className={`w-full max-w-md ${paid ? "flex flex-col justify-center min-h-screen" : "pt-16"}`}>

        {!paid && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                <span className="text-yellow-400">LN</span>-Breeze
              </h1>
              <button
                onClick={handleDisconnect}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Disconnect
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <p className="text-xs text-white/40">
                Connected to <span className="text-white/70">{credentials.walletName}</span>
              </p>
            </div>
          </div>
        )}

        <div className="space-y-5">
        {!invoice && (
          <InvoiceForm
            onInvoiceCreated={handleInvoiceCreated}
            credentialHeaders={credentialHeaders()}
          />
        )}

        {invoice && !paid && invoiceMeta && (
          <InvoiceDisplay
            invoice={invoice}
            amount={invoiceMeta.amount}
            description={invoiceMeta.description}
          />
        )}

        {invoice && (
          <PaymentStatus
            invoice={invoice}
            wsUrl={credentials.wsUrl}
            onPaid={() => setPaid(true)}
            onReset={handleReset}
          />
        )}

        {invoice && !paid && (
          <button
            onClick={handleReset}
            className="w-full text-xs text-white/30 hover:text-white/60 transition-colors py-1"
          >
            ← Generate a new invoice
          </button>
        )}
        </div>
      </div>
    </main>
  );
}
