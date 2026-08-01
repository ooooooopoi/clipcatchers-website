import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;

export const mailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);

function transporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

function shell(title: string, body: string, cta?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#09090b;padding:32px 16px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#111113;border:1px solid #27272a;border-radius:14px;padding:32px">
      <tr><td style="color:#fafafa;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">Clip<span style="color:#84cc16">⚡</span>Catchers</td></tr>
      <tr><td style="padding-top:20px;color:#fafafa;font-size:22px;font-weight:700">${title}</td></tr>
      <tr><td style="padding-top:12px;color:#a1a1aa;font-size:15px;line-height:1.6">${body}</td></tr>
      ${
        cta
          ? `<tr><td style="padding-top:26px"><a href="${cta.url}" style="display:inline-block;background:#84cc16;color:#0a0a0a;font-weight:600;font-size:15px;text-decoration:none;padding:12px 22px;border-radius:9px">${cta.label}</a></td></tr>
             <tr><td style="padding-top:18px;color:#52525b;font-size:12px;word-break:break-all">Or paste this link into your browser:<br>${cta.url}</td></tr>`
          : ""
      }
      <tr><td style="padding-top:28px;border-top:1px solid #27272a;color:#52525b;font-size:12px">You're receiving this because someone used this address on the Clip Catchers client dashboard.</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

async function send(to: string, subject: string, html: string, fallbackUrl: string) {
  if (!mailConfigured) {
    // No SMTP configured — surface the link so the flow is still completable.
    console.warn(`[mail] SMTP not configured. Link for ${to}: ${fallbackUrl}`);
    return { delivered: false as const, url: fallbackUrl };
  }
  await transporter().sendMail({
    from: SMTP_FROM ?? "Clip Catchers <no-reply@clipcatchers.com>",
    to,
    subject,
    html,
  });
  return { delivered: true as const, url: fallbackUrl };
}

export function sendVerificationEmail(to: string, name: string, url: string) {
  return send(
    to,
    "Verify your Clip Catchers account",
    shell(
      `Welcome, ${name}`,
      "Confirm this email address to activate your Clip Catchers client dashboard. This link expires in 24 hours.",
      { label: "Verify email", url },
    ),
    url,
  );
}

export function sendPasswordResetEmail(to: string, name: string, url: string) {
  return send(
    to,
    "Reset your Clip Catchers password",
    shell(
      `Hi ${name}`,
      "We received a request to reset your password. This link expires in 1 hour. If you didn't ask for this, you can safely ignore this email.",
      { label: "Reset password", url },
    ),
    url,
  );
}
