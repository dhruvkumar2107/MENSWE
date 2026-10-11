import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/store/contact-form";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Contact Us | MAISON HOMME" };

export default async function ContactPage() {
  const settings = await getSettings();
  const details = [
    { icon: Phone, label: "Phone", value: settings["contact.phone"] },
    { icon: Mail, label: "Email", value: settings["contact.email"] },
    { icon: MapPin, label: "Address", value: settings["contact.address"] },
  ];
  return (
    <div className="container-narrow py-16">
      <SectionHeading eyebrow="Client Services" title="Contact Us" align="center" />
      <p className="mx-auto mt-6 max-w-xl text-center text-sm text-graphite">
        Questions about an order, styling advice or a private appointment — our client services team is here to help.
      </p>
      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-5">
          {details.map((d) => (
            <div key={d.label} className="flex items-start gap-3">
              <d.icon className="mt-0.5 h-4 w-4 text-gold-deep" />
              <div>
                <span className="block text-[11px] uppercase tracking-[0.18em] text-graphite">{d.label}</span>
                <span className="block text-sm">{d.value}</span>
              </div>
            </div>
          ))}
        </div>
        <ContactForm />
      </div>
    </div>
  );
}