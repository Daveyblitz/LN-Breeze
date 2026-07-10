# ⚡ LN-Breeze

> **Confirming lightning payments made easy**

A web application for generating Bitcoin Lightning Network invoices and tracking payments in real time — directly in the browser, with no CLI or technical setup required.

Live: **[ln-breeze.vercel.app](https://ln-breeze.vercel.app)**

---

## Features

- **Wallet connection** — Create a new LNbits wallet or connect an existing one with your Invoice Key and Wallet ID
- **Invoice generation** — Enter an amount (satoshis) and description to produce a BOLT11 invoice instantly
- **QR code display** — Scannable QR code + truncated BOLT11 string with one-click copy
- **Real-time payment detection** — WebSocket connection to LNbits fires the moment a payment arrives; no page refresh needed
- **Polling fallback** — If the WebSocket drops, polling takes over automatically every 3 seconds
- **Email invoices** — Send a formatted HTML invoice (QR code included) to a customer email address
- **Countdown timer** — 10-minute expiry countdown with automatic "expired" state on timeout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Lightning Backend | [LNbits](https://lnbits.com) REST API + WebSocket |
| Real-time | LNbits WebSocket (primary) + polling fallback |
| QR Code | qrcode.react |
| Email | Resend |
| UI | Tailwind CSS + shadcn/ui (glassmorphism) |
| Font | Inter |
| Tests | Vitest + @testing-library/react (24 tests) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An LNbits instance (e.g. [demo.lnbits.com](https://demo.lnbits.com)) — free to use
- A [Resend](https://resend.com) account for email (optional)

### 1. Clone and install

```bash
git clone https://github.com/Daveyblitz/LN-Breeze.git
cd LN-Breeze/3lightning-invoice-generator-and-tracker
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# LNbits — used as the default wallet when no credentials are passed via the UI
LNBITS_URL=https://demo.lnbits.com
LNBITS_INVOICE_KEY=your_invoice_key_here
LNBITS_WALLET_ID=your_wallet_id_here
LNBITS_ADMIN_KEY=your_admin_key_here

# Resend — required only for the email feature
RESEND_API_KEY=your_resend_api_key_here
```

> **Note:** These values are only ever read server-side by Next.js API routes. They are never bundled into client JavaScript.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How It Works

```
1. Connect wallet  →  Create new LNbits wallet OR paste existing credentials
2. Generate invoice  →  Enter amount + description → BOLT11 invoice created via LNbits API
3. Share  →  Customer scans QR code or copies the BOLT11 string into any Lightning wallet
4. Detection  →  WebSocket fires instantly on payment; polling fallback if WS drops
5. Success  →  UI transitions to "Payment received" screen
```

### Payment Detection Architecture

```
Invoice generated
  ├── WebSocket opens to LNbits /api/v1/ws/<walletId>
  │     → onmessage: checks payment_hash / payment.payment_hash / checking_id
  │     → match: fires onSettled(), disconnects
  │     → close: reconnects with exponential backoff (1s → 2s → 4s → max 30s)
  │
  └── Polling (enabled only when WebSocket is disconnected)
        → GET /api/invoice/status?hash=<hash> every 3s
        → paid: true fires onSettled()
        → Both paths call the same idempotent handler — no double-triggers
```

---

## Project Structure

```
app/
  page.tsx                    # Main page & state management
  layout.tsx                  # Root layout, Inter font, gradient background
  globals.css                 # Glassmorphism utility classes
  api/
    wallet/route.ts           # GET wallet info + WebSocket URL
    invoice/
      create/route.ts         # POST — create BOLT11 invoice
      status/route.ts         # GET  — check payment status
      email/route.ts          # POST — send invoice email via Resend
    account/
      create/route.ts         # POST — create new LNbits wallet

components/
  ConnectionScreen.tsx        # Create/connect wallet UI
  InvoiceForm.tsx             # Amount + description form
  InvoiceDisplay.tsx          # QR code, BOLT11 display, copy, email
  PaymentStatus.tsx           # Live tracker, countdown, paid/expired screens

lib/
  websocket.ts                # InvoiceWebSocket class (connect, backoff, disconnect)
  polling.ts                  # usePolling React hook
  math.ts                     # parseSats() — validates satoshi input

types/
  invoice.ts                  # Invoice, InvoiceStatus types

__tests__/
  lib/websocket.test.ts       # 10 tests — WebSocket event handling
  lib/polling.test.tsx        # 8 tests  — Polling hook lifecycle
  api/invoice-status.test.ts  # 6 tests  — API route + LNbits proxy
```

---

## Tests

```bash
npm test
```

24 tests — no real funds or network required:

| File | Tests | What's covered |
|---|---|---|
| `websocket.test.ts` | 10 | All 3 LNbits message shapes, wrong hash rejection, reconnect scheduling, malformed JSON handling |
| `polling.test.tsx` | 8 | Enabled/disabled states, correct URL, onPaid fires on paid:true, stops after payment, network error resilience, cleanup on unmount |
| `invoice-status.test.ts` | 6 | Missing hash/credentials (400), paid/unpaid responses, LNbits error (500), header creds override env vars |

---

## Public API

LN-Breeze exposes a versioned REST API that any developer can integrate with.

**Base URL:** `https://ln-breeze.vercel.app/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Exchange LNbits credentials for an API key |
| `POST` | `/invoices` | Create a Lightning invoice |
| `GET` | `/invoices/:hash` | Check if an invoice was paid |
| `GET` | `/wallet` | Get wallet name and balance |

Full API documentation: [docs/](./docs/)

---

## Deploying to Vercel

1. Set **Root Directory** to `3lightning-invoice-generator-and-tracker` in Vercel project settings
2. Add environment variables under **Settings → Environment Variables**:
   - `LNBITS_URL`
   - `LNBITS_INVOICE_KEY`
   - `LNBITS_WALLET_ID`
   - `LNBITS_ADMIN_KEY`
   - `RESEND_API_KEY`
   - `JWT_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Redeploy

---

## Security

- LNbits credentials are read **server-side only** — never exposed to the browser
- When users connect their own wallet, credentials travel as custom HTTP headers (server-to-server only)
- The browser only ever receives the BOLT11 string, payment hash, and WebSocket URL — none of which can drain a wallet
- `.env.local` is gitignored

---

## License

MIT
