import type { NextRequest } from "next/server";

// Generates an elegant, on-brand SVG placeholder. Used only when a product has
// no uploaded photography, so the storefront never renders a broken image.

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const label = (searchParams.get("label") || "MAISON HOMME").slice(0, 60);
  const sub = (searchParams.get("sub") || "PREMIUM MENSWEAR").slice(0, 60);
  const w = Math.min(Math.max(Number(searchParams.get("w")) || 800, 100), 2400);
  const h = Math.min(Math.max(Number(searchParams.get("h")) || 1000, 100), 3000);

  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w2) => w2[0]?.toUpperCase() ?? "")
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#171717"/>
      <stop offset="100%" stop-color="#0b0b0b"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="#B89B62" stroke-opacity="0.55"/>
  <text x="50%" y="46%" text-anchor="middle" fill="#B89B62" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(
    w / 6,
  )}" letter-spacing="6">${escapeXml(initials)}</text>
  <text x="50%" y="58%" text-anchor="middle" fill="#F7F4EF" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(
    w / 26,
  )}" letter-spacing="4">${escapeXml(label.toUpperCase())}</text>
  <text x="50%" y="64%" text-anchor="middle" fill="#8a8577" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(
    w / 40,
  )}" letter-spacing="3">${escapeXml(sub.toUpperCase())}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
