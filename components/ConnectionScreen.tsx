"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Wifi, WifiOff, Loader2, Copy, Check } from "lucide-react";

export type WalletCredentials = {
  lnbitsUrl: string;
  invoiceKey: string;
  walletId: string;
  walletName: string;
  wsUrl: string;
};

type Props = {
  onConnected: (credentials: WalletCredentials) => void;
};

type Tab = "create" | "connect";
type Status = "idle" | "loading" | "success" | "error";

export default function ConnectionScreen({ onConnected }: Props) {
  const [tab, setTab] = useState<Tab>("create");
  const [createUrl, setCreateUrl] = useState("https://demo.lnbits.com");
  const [walletName, setWalletName] = useState("");
  const [newCredentials, setNewCredentials] = useState<WalletCredentials | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [connectUrl, setConnectUrl] = useState("https://demo.lnbits.com");
  const [invoiceKey, setInvoiceKey] = useState("");
  const [walletId, setWalletId] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleCreate() {
    if (!walletName.trim()) { setErrorMsg("Please enter a wallet name"); return; }
    setStatus("loading"); setErrorMsg("");

    const res = await fetch("/api/account/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lnbitsUrl: createUrl, walletName: walletName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setErrorMsg(data.error ?? "Failed to create wallet"); setStatus("error"); return; }

    const walletRes = await fetch("/api/wallet", {
      headers: {
        "x-lnbits-url": createUrl,
        "x-lnbits-invoice-key": data.invoiceKey,
        "x-lnbits-wallet-id": data.walletId,
      },
    });
    const walletData = await walletRes.json();
    setNewCredentials({
      lnbitsUrl: createUrl,
      invoiceKey: data.invoiceKey,
      walletId: data.walletId,
      walletName: data.walletName,
      wsUrl: walletData.wsUrl ?? "",
    });
    setStatus("success");
  }

  async function handleConnect() {
    if (!invoiceKey.trim() || !walletId.trim()) { setErrorMsg("Please fill in all fields"); return; }
    setStatus("loading"); setErrorMsg("");

    const res = await fetch("/api/wallet", {
      headers: {
        "x-lnbits-url": connectUrl,
        "x-lnbits-invoice-key": invoiceKey.trim(),
        "x-lnbits-wallet-id": walletId.trim(),
      },
    });
    const data = await res.json();
    if (!res.ok) { setErrorMsg(data.error ?? "Could not connect — check your credentials"); setStatus("error"); return; }

    onConnected({
      lnbitsUrl: connectUrl,
      invoiceKey: invoiceKey.trim(),
      walletId: walletId.trim(),
      walletName: data.name,
      wsUrl: data.wsUrl,
    });
  }

  async function copyInvoiceKey() {
    if (!newCredentials) return;
    await navigator.clipboard.writeText(newCredentials.invoiceKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  if (status === "success" && newCredentials) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white tracking-tight">
              <span className="text-yellow-400">LN</span>-Breeze
            </div>
            <p className="text-white/40 text-sm mt-1">confirming lightning payments made easy</p>
          </div>

          <div className="glass p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Wifi className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-400">Wallet created</p>
                <p className="text-xs text-white/40">{newCredentials.walletName} · {newCredentials.lnbitsUrl}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
              <p className="text-xs text-yellow-400 font-medium mb-1">⚠ Save these credentials — there is no recovery</p>
              <p className="text-xs text-white/40">If you lose them, you won't be able to reconnect to this wallet.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/40 uppercase tracking-widest">Invoice key</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={`${newCredentials.invoiceKey.slice(0, 14)}...`}
                  className="glass-input flex-1 px-3 py-2 text-xs font-mono rounded-lg"
                />
                <button
                  onClick={copyInvoiceKey}
                  className="w-9 h-9 rounded-lg border border-white/12 bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/40 uppercase tracking-widest">Wallet ID</label>
              <input
                readOnly
                value={newCredentials.walletId}
                className="glass-input w-full px-3 py-2 text-xs font-mono rounded-lg"
              />
            </div>

            <button
              onClick={() => onConnected(newCredentials)}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Start generating invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              <span className="text-yellow-400">LN</span>-Breeze
            </h1>
            <p className="text-white/40 text-sm mt-2">confirming lightning payments made easy</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass p-6 space-y-5">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1">
            {(["create", "connect"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setStatus("idle"); setErrorMsg(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === t
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {t === "create" ? "Create wallet" : "Connect existing"}
              </button>
            ))}
          </div>

          {tab === "create" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 uppercase tracking-widest">LNbits URL</label>
                <input
                  value={createUrl}
                  onChange={(e) => setCreateUrl(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 text-sm rounded-lg"
                  disabled={status === "loading"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 uppercase tracking-widest">Wallet name</label>
                <input
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="e.g. My Shop Wallet"
                  className="glass-input w-full px-3 py-2.5 text-sm rounded-lg"
                  disabled={status === "loading"}
                />
              </div>
            </div>
          )}

          {tab === "connect" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 uppercase tracking-widest">LNbits URL</label>
                <input
                  value={connectUrl}
                  onChange={(e) => setConnectUrl(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 text-sm rounded-lg"
                  disabled={status === "loading"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 uppercase tracking-widest">Invoice key</label>
                <input
                  value={invoiceKey}
                  onChange={(e) => setInvoiceKey(e.target.value)}
                  placeholder="Paste your Invoice/Read Key"
                  className="glass-input w-full px-3 py-2.5 text-sm rounded-lg"
                  disabled={status === "loading"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 uppercase tracking-widest">Wallet ID</label>
                <input
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  placeholder="Paste your Wallet ID"
                  className="glass-input w-full px-3 py-2.5 text-sm rounded-lg"
                  disabled={status === "loading"}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{errorMsg}</p>
            </div>
          )}

          <button
            disabled={status === "loading"}
            onClick={tab === "create" ? handleCreate : handleConnect}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{tab === "create" ? "Creating..." : "Connecting..."}</>
            ) : (
              <><Wifi className="w-4 h-4" />{tab === "create" ? "Create wallet" : "Connect"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
