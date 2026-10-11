import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = { title: "FAQs | MAISON HOMME" };

const FAQS: { q: string; a: string }[] = [
  { q: "How long will my order take to arrive?", a: "Orders are dispatched within 1–2 business days. Metro cities typically receive orders in 2–4 days and the rest of India within 4–6 business days." },
  { q: "Do you offer free shipping?", a: "Yes. Shipping is complimentary on all orders above ₹1,499. A flat fee applies below that, and a nominal fee applies for Cash on Delivery." },
  { q: "What payment methods do you accept?", a: "We accept UPI, credit and debit cards, net banking, wallets and Cash on Delivery on eligible PIN codes. All online payments are processed securely via Razorpay." },
  { q: "How do I return or exchange an item?", a: "Eligible items can be returned within 7 days of delivery. Visit Returns & Exchanges in your account to raise a request, or contact client services." },
  { q: "Are the sizes true to fit?", a: "Our garments follow standard Indian sizing. Please refer to the size guide on each product page for measurements, and size up for a relaxed fit." },
  { q: "How do I track my order?", a: "Once dispatched, you can track your order from the Orders section of your account. We also email tracking details as soon as your parcel ships." },
  { q: "Do you have a physical store?", a: "We are currently an online-first atelier, with private styling appointments available by request in Mumbai." },
  { q: "How should I care for my garments?", a: "Dry clean tailored pieces, wash cottons cold and inside-out, and always follow the care label. Store knitwear folded to preserve its shape." },
];

export default function FaqsPage() {
  return (
    <div className="container-narrow py-16">
      <SectionHeading eyebrow="Help Centre" title="Frequently Asked Questions" align="center" />
      <div className="mx-auto mt-12 max-w-2xl divide-y divide-line border border-line bg-white">
        {FAQS.map((item) => (
          <details key={item.q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
              {item.q}
              <span className="text-gold-deep transition-transform group-open:rotate-45">＋</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-graphite">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}