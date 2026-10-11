"use server";

import { sendMail } from "@/lib/mailer";
import { getSetting } from "@/lib/settings";

export type ContactState = { ok?: boolean; error?: string };

export async function contactAction(_prev: ContactState | undefined, formData: FormData): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) return { error: "Please fill in your name, email and message" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Please enter a valid email address" };

  const to = (await getSetting("contact.email")) || "care@maisonhomme.in";
  await sendMail({
    to,
    subject: `New enquiry from ${name}`,
    html: `<p><strong>${name}</strong> (${email}${phone ? `, ${phone}` : ""}) wrote:</p><p>${message.replace(/</g, "&lt;")}</p>`,
  });

  return { ok: true };
}