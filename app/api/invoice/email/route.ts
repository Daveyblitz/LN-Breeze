import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { to, amount, description, paymentRequest, paymentHash, expiresAt } =
      await req.json();

    if (!to || !paymentRequest) {
      return NextResponse.json(
        { error: "Recipient email and payment request are required" },
        { status: 400 }
      );
    }

    // Use a public QR code API — Gmail blocks base64 data URLs but loads external image URLs fine
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(paymentRequest)}&size=250x250&margin=2`;

    const expiryDate = new Date(expiresAt).toLocaleString();
    const shortHash = `${paymentHash.slice(0, 10)}...${paymentHash.slice(-6)}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#09090b;padding:28px 32px;text-align:center;">
              <span style="font-size:28px;">⚡</span>
              <h1 style="color:#ffffff;margin:8px 0 4px;font-size:22px;font-weight:700;">Lightning Invoice</h1>
              <p style="color:#a1a1aa;margin:0;font-size:13px;">You have received a payment request</p>
            </td>
          </tr>

          <!-- Amount -->
          <tr>
            <td style="padding:28px 32px 0;text-align:center;">
              <p style="margin:0;color:#71717a;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Amount Due</p>
              <p style="margin:4px 0 0;color:#09090b;font-size:36px;font-weight:700;">${amount.toLocaleString()} <span style="font-size:18px;color:#71717a;">sats</span></p>
            </td>
          </tr>

          <!-- Description -->
          <tr>
            <td style="padding:16px 32px 0;text-align:center;">
              <p style="margin:0;color:#09090b;font-size:15px;">${description}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:24px 32px 0;"><hr style="border:none;border-top:1px solid #f4f4f5;margin:0;" /></td></tr>

          <!-- QR Code -->
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="margin:0 0 16px;color:#71717a;font-size:13px;">Scan to pay</p>
              <img src="${qrImageUrl}" width="250" height="250" alt="Payment QR Code" style="display:block;margin:0 auto;border-radius:8px;" />
            </td>
          </tr>

          <!-- Payment Request -->
          <tr>
            <td style="padding:0 32px;">
              <p style="margin:0 0 8px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Payment Request (BOLT11)</p>
              <div style="background:#f4f4f5;border-radius:8px;padding:12px;word-break:break-all;">
                <code style="font-size:11px;color:#09090b;line-height:1.6;">${paymentRequest}</code>
              </div>
            </td>
          </tr>

          <!-- Hash & Expiry -->
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;padding-right:8px;">
                    <p style="margin:0 0 4px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Payment Hash</p>
                    <p style="margin:0;color:#09090b;font-size:12px;font-family:monospace;">${shortHash}</p>
                  </td>
                  <td style="width:50%;padding-left:8px;">
                    <p style="margin:0 0 4px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Expires</p>
                    <p style="margin:0;color:#09090b;font-size:12px;">${expiryDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;padding:20px 32px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">Powered by Lightning Invoice Generator</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: "Lightning Invoice <onboarding@resend.dev>",
      to,
      subject: `⚡ Lightning Invoice — ${amount.toLocaleString()} sats`,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
