import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "MAISON HOMME — Premium Menswear",
    template: "%s · MAISON HOMME",
  },
  description:
    "Refined essentials and modern silhouettes for the discerning man. Shirts, trousers, denim, blazers and occasion wear.",
  openGraph: {
    type: "website",
    siteName: "MAISON HOMME",
    title: "MAISON HOMME — Premium Menswear",
    description: "Refined essentials. Modern silhouettes. Confidence in every detail.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Loaded at runtime; gracefully falls back to system serif/sans offline. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
