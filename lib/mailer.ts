import { createTransport, type Transporter } from "nodemailer";
import { formatINR } from "@/lib/money";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const from = process.env.MAIL_FROM || "MAISON HOMME <no-reply@maisonhomme.local>";
  const tp = getTransporter();
  if (!tp) {
    // Dev / unconfigured: log instead of failing order flows.
    console.info(`[mailer:not-configured] To: ${params.to} | Subject: ${params.subject}`);
    return { sent: false, reason: "SMTP not configured" };
  }
  try {
    await tp.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text ?? params.html.replace(/<[^>]+>/g, " "),
    });
    return { sent: true };
  } catch (error) {
    console.error("[mailer:error]", error);
    return { sent: false, reason: "send failed" };
  }
}

const shell = (title: string, body: string) => `
  <div style="background:#F7F4EF;padding:32px;font-family:Helvetica,Arial,sans-serif;color:#101010">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6e0d6">
      <div style="padding:24px 32px;border-bottom:1px solid #e6e0d6">
        <span style="font-family:Georgia,serif;letter-spacing:6px;font-size:18px">MAISON HOMME</span>
      </div>
      <div style="padding:32px">
        <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px">${title}</h1>
        ${body}
      </div>
      <div style="padding:20px 32px;border-top:1px solid #e6e0d6;color:#6b655c;font-size:12px">
        © ${new Date().getFullYear()} MAISON HOMME · Premium Menswear
      </div>
    </div>
  </div>`;

export function orderConfirmationEmail(params: {
  name: string;
  orderNumber: string;
  total: number;
  items: { name: string; size: string; color: string; quantity: number }[];
}) {
  const rows = params.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.name} <span style="color:#6b655c">(${i.color} / ${i.size})</span> ×${i.quantity}</td></tr>`,
    )
    .join("");
  return {
    subject: `Order confirmed — ${params.orderNumber}`,
    html: shell(
      "Thank you for your order",
      `<p>Hi ${params.name}, we've received your order <strong>${params.orderNumber}</strong>.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>
       <p style="font-size:18px">Total: <strong>${formatINR(params.total)}</strong></p>`,
    ),
  };
}

export function passwordResetEmail(name: string, link: string) {
  return {
    subject: "Reset your password",
    html: shell(
      "Password reset",
      `<p>Hi ${name},</p><p>Use the link below to reset your password. It expires in 1 hour.</p>
       <p><a href="${link}" style="color:#B89B62">${link}</a></p>
       <p style="color:#6b655c;font-size:12px">If you didn't request this, you can ignore this email.</p>`,
    ),
  };
}

export function welcomeEmail(name: string) {
  return {
    subject: "Welcome to MAISON HOMME",
    html: shell(
      "Welcome to the house",
      `<p>Hi ${name},</p><p>Your account is ready. Explore refined essentials crafted for the modern man.</p>`,
    ),
  };
}
