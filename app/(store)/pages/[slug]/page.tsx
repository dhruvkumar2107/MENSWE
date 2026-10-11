import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { SectionHeading } from "@/components/ui";

const POLICY_MAP: Record<string, { title: string; key: string; eyebrow: string }> = {
  "shipping-policy": { title: "Shipping Policy", key: "policy.shipping", eyebrow: "Customer Care" },
  "return-policy": { title: "Returns & Refunds", key: "policy.returns", eyebrow: "Customer Care" },
  privacy: { title: "Privacy Policy", key: "policy.privacy", eyebrow: "Legal" },
  terms: { title: "Terms & Conditions", key: "policy.terms", eyebrow: "Legal" },
};

const CONTENT_MAP: Record<string, { title: string; eyebrow: string; paragraphs: string[] }> = {
  about: {
    title: "About MAISON HOMME",
    eyebrow: "The House",
    paragraphs: [
      "MAISON HOMME was founded on a simple belief: that a well-made garment should feel inevitable — cut with intention, finished with care, and made to be worn for years rather than seasons.",
      "Every piece begins in our Mumbai atelier, where fabric is selected by hand and patterns are refined across countless fittings. We work with mills in India and abroad to source cottons, linens, merino and silks that hold their shape and their story.",
      "We are committed to considered production. Small runs, responsible materials, and craftsmanship that respects both the maker and the wearer.",
    ],
  },
  care: {
    title: "Garment Care",
    eyebrow: "The House",
    paragraphs: [
      "To keep your pieces looking their best: dry clean tailored garments, wash cottons cold and inside-out, and always follow the care label sewn into each piece.",
      "Store knitwear folded rather than hung, and allow garments to rest between wears so natural fibres recover their shape.",
    ],
  },
};

export async function generateStaticParams() {
  return [...Object.keys(POLICY_MAP), ...Object.keys(CONTENT_MAP)].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = POLICY_MAP[slug]?.title ?? CONTENT_MAP[slug]?.title;
  if (!title) return { title: "Not Found" };
  return { title: `${title} | MAISON HOMME` };
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = POLICY_MAP[slug];
  const content = CONTENT_MAP[slug];
  if (!policy && !content) notFound();

  const settings = await getSettings();
  const eyebrow = policy?.eyebrow ?? content?.eyebrow ?? "";
  const title = policy?.title ?? content?.title ?? "";
  const bodyText = policy ? settings[policy.key] : "";
  const paragraphs = policy ? bodyText.split(/\n{2,}/).filter(Boolean) : (content?.paragraphs ?? []);

  return (
    <div className="container-narrow py-16">
      <SectionHeading eyebrow={eyebrow} title={title} align="center" />
      <div className="prose-mh mx-auto mt-10 max-w-2xl">
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-5 text-[15px] leading-relaxed text-graphite">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}