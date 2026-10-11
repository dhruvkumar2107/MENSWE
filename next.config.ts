import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components (PPR) is disabled so this storefront can use standard
  // dynamic rendering for its authenticated + database-driven routes.
  // See node_modules/next/dist/docs for the cacheComponents model.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Product photography is uploaded by admins (Cloudinary or any CDN).
    // These remote hosts are allow-listed for that purpose.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
    qualities: [50, 75, 90],
  },
};

export default nextConfig;
