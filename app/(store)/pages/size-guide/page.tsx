import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Size Guide | MAISON HOMME" };

const TOPS = [
  ["Size", "Chest (in)", "Waist (in)", "Shoulder (in)", "Length (in)"],
  ["XS", "36", "30", "16.5", "27"],
  ["S", "38", "32", "17.5", "28"],
  ["M", "40", "34", "18.5", "29"],
  ["L", "42", "36", "19.5", "30"],
  ["XL", "44", "38", "20.5", "31"],
  ["XXL", "46", "40", "21.5", "32"],
];

const BOTTOMS = [
  ["Size", "Waist (in)", "Hip (in)", "Inseam (in)"],
  ["28", "28", "36", "30"],
  ["30", "30", "38", "30.5"],
  ["32", "32", "40", "31"],
  ["34", "34", "42", "31.5"],
  ["36", "36", "44", "32"],
  ["38", "38", "46", "32.5"],
];

function SizeTable({ title, rows }: { title: string; rows: string[][] }) {
  const [head, ...body] = rows;
  return (
    <div>
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">{title}</h2>
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[540px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/60 text-left">
              {head.map((h) => (
                <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row) => (
              <tr key={row[0]} className="border-b border-line last:border-0">
                {row.map((cell, i) => (
                  <td key={i} className={i === 0 ? "px-4 py-3 font-medium" : "px-4 py-3 text-graphite"}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SizeGuidePage() {
  return (
    <div className="container-narrow py-16">
      <SectionHeading eyebrow="Fit & Measurements" title="Size Guide" align="center" />
      <p className="mx-auto mt-6 max-w-xl text-center text-sm text-graphite">
        All measurements are in inches and refer to body measurements. If you are between sizes, we recommend sizing up for a relaxed fit.
      </p>
      <div className="mt-12 flex flex-col gap-10">
        <SizeTable title="Shirts, Tees & Outerwear" rows={TOPS} />
        <SizeTable title="Trousers & Denim" rows={BOTTOMS} />
      </div>
      <div className="mt-10 border border-line bg-white p-6 text-sm text-graphite">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-obsidian">How to measure</h3>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Chest:</strong> measure around the fullest part of your chest, keeping the tape level.</li>
          <li><strong>Waist:</strong> measure around your natural waistline, keeping the tape comfortably loose.</li>
          <li><strong>Shoulder:</strong> measure from the tip of one shoulder across to the other.</li>
          <li><strong>Inseam:</strong> measure from the top of your inner thigh to your ankle.</li>
        </ul>
      </div>
    </div>
  );
}