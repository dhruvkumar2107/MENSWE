import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { ContentBlockForm, FaqForm, SettingsForm } from "@/components/admin/content-forms";
import { deleteContentBlockAction, deleteFaqAction } from "@/lib/actions/admin";
import { StatusPill } from "@/components/admin/status-pill";

const SETTING_GROUPS: { title: string; fields: { key: string; label: string; type?: string; textarea?: boolean }[] }[] = [
  {
    title: "Brand",
    fields: [
      { key: "brand.name", label: "Brand name" },
      { key: "brand.tagline", label: "Tagline" },
      { key: "brand.logoUrl", label: "Logo URL" },
      { key: "announcement.messages", label: "Announcement messages (| separated)", textarea: true },
    ],
  },
  {
    title: "Hero",
    fields: [
      { key: "hero.heading", label: "Hero heading" },
      { key: "hero.subheading", label: "Hero subheading" },
      { key: "hero.image", label: "Hero image URL" },
      { key: "hero.ctaPrimaryLabel", label: "Primary CTA label" },
      { key: "hero.ctaPrimaryHref", label: "Primary CTA href" },
      { key: "hero.ctaSecondaryLabel", label: "Secondary CTA label" },
      { key: "hero.ctaSecondaryHref", label: "Secondary CTA href" },
    ],
  },
  {
    title: "Contact",
    fields: [
      { key: "contact.email", label: "Support email", type: "email" },
      { key: "contact.phone", label: "Phone" },
      { key: "contact.whatsapp", label: "WhatsApp" },
      { key: "contact.address", label: "Address", textarea: true },
    ],
  },
  {
    title: "Shipping & returns",
    fields: [
      { key: "shipping.freeThreshold", label: "Free shipping threshold (paise)" },
      { key: "shipping.standard", label: "Standard shipping (paise)" },
      { key: "shipping.codFee", label: "COD fee (paise)" },
      { key: "shipping.returnWindowDays", label: "Return window (days)" },
    ],
  },
  {
    title: "Social & SEO",
    fields: [
      { key: "social.instagram", label: "Instagram URL" },
      { key: "social.facebook", label: "Facebook URL" },
      { key: "social.youtube", label: "YouTube URL" },
      { key: "social.twitter", label: "X URL" },
      { key: "seo.defaultTitle", label: "Default SEO title" },
      { key: "seo.defaultDescription", label: "Default SEO description", textarea: true },
    ],
  },
  {
    title: "Policies",
    fields: [
      { key: "policy.shipping", label: "Shipping policy", textarea: true },
      { key: "policy.returns", label: "Returns policy", textarea: true },
      { key: "policy.privacy", label: "Privacy policy", textarea: true },
      { key: "policy.terms", label: "Terms", textarea: true },
    ],
  },
];

export default async function AdminContentPage() {
  await requireAdmin("content:read");
  const [settings, blocks, faqs] = await Promise.all([
    getSettings(),
    prisma.contentBlock.findMany({ orderBy: { position: "asc" } }),
    prisma.faq.findMany({ orderBy: { position: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-3xl">Content &amp; Settings</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Content blocks</h2>
        <ContentBlockForm />
        <div className="flex flex-col gap-3">
          {blocks.map((b) => (
            <div key={b.id} className="flex flex-col gap-2 border border-[#e4ded4] bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{b.key} <span className="text-xs text-[#6b655c]">({b.type})</span></span>
                <div className="flex items-center gap-3">
                  <StatusPill value={b.isActive ? "DELIVERED" : "CANCELLED"} />
                  <form action={deleteContentBlockAction.bind(null, b.id)}>
                    <button type="submit" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-600 underline">Delete</button>
                  </form>
                </div>
              </div>
              {b.title && <span className="text-sm text-[#6b655c]">{b.title} — {b.subtitle ?? ""}</span>}
              <ContentBlockForm block={b} />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">FAQs</h2>
        <FaqForm />
        <div className="flex flex-col gap-2">
          {faqs.map((f) => (
            <div key={f.id} className="border border-[#e4ded4] bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{f.question}</p>
                  <p className="text-xs text-[#6b655c]">{f.answer}</p>
                </div>
                <form action={deleteFaqAction.bind(null, f.id)}>
                  <button type="submit" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-600 underline">Delete</button>
                </form>
              </div>
              <div className="mt-3"><FaqForm faq={f} /></div>
            </div>
          ))}
        </div>
      </section>

      {SETTING_GROUPS.map((group) => (
        <section key={group.title} className="flex flex-col gap-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">{group.title}</h2>
          <SettingsForm settings={settings} fields={group.fields} />
        </section>
      ))}
    </div>
  );
}