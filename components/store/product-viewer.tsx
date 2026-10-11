"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Truck, RotateCcw, ShieldCheck, ZoomIn, Star, Minus, Plus, Check,
} from "lucide-react";
import { formatINR, percentOff } from "@/lib/money";
import { cn } from "@/lib/utils";
import { addToBagAction } from "@/lib/actions/cart";
import { WishlistButton } from "@/components/store/wishlist-button";
import { Badge } from "@/components/ui";

export type ViewerVariant = {
  id: string;
  color: string;
  colorHex: string | null;
  size: string;
  priceOverride: number | null;
  available: number;
  sku: string;
};

export type ViewerImage = { url: string; alt: string | null; color: string | null };

export type ViewerProduct = {
  id: string;
  slug: string;
  name: string;
  parentSku: string;
  price: number;
  salePrice: number | null;
  description: string;
  fabric: string | null;
  careInstructions: string | null;
  fit: string | null;
  occasion: string | null;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isLimitedEdition: boolean;
  variants: ViewerVariant[];
  images: ViewerImage[];
  rating: number;
  reviewCount: number;
  categoryName: string;
};

const SIZE_GUIDE: Record<string, { chest: string; waist: string; shoulder: string }> = {
  S: { chest: "36–38", waist: "30–32", shoulder: "17.5" },
  M: { chest: "38–40", waist: "32–34", shoulder: "18" },
  L: { chest: "40–42", waist: "34–36", shoulder: "18.5" },
  XL: { chest: "42–44", waist: "36–38", shoulder: "19" },
  XXL: { chest: "44–46", waist: "38–40", shoulder: "19.5" },
  "3XL": { chest: "46–48", waist: "40–42", shoulder: "20" },
};

export function ProductViewer({ product, pricePerUnit = false }: { product: ViewerProduct; pricePerUnit?: boolean }) {
  const router = useRouter();
  const [color, setColor] = useState<string | null>(() => {
    const avail = product.variants.find((v) => v.available > 0);
    return avail?.color ?? product.variants[0]?.color ?? null;
  });
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinResult, setPinResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (msgTimer.current) clearTimeout(msgTimer.current);
  }, []);

  const colors = useMemo(
    () => Array.from(new Map(product.variants.map((v) => [v.color, { color: v.color, hex: v.colorHex }])).values()),
    [product.variants],
  );

  const sizesForColor = useMemo(() => {
    const list = product.variants.filter((v) => v.color === color);
    return Array.from(new Map(list.map((v) => [v.size, v])).values());
  }, [product.variants, color]);

  const variant = useMemo(
    () => product.variants.find((v) => v.color === color && v.size === size) ?? null,
    [product.variants, color, size],
  );

  const effectivePrice = variant?.priceOverride ?? product.salePrice ?? product.price;

  const images = useMemo(() => {
    const colored = product.images.filter((i) => i.color === color);
    return colored.length > 0 ? colored : product.images;
  }, [product.images, color]);

  useEffect(() => {
    setImageIndex(0);
  }, [color]);

  const flash = (text: string, ok: boolean) => {
    setMessage({ ok, text });
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMessage(null), 3000);
  };

  const handleAdd = async (): Promise<boolean> => {
    if (!variant) {
      setSizeError(true);
      flash("Please select a size", false);
      return false;
    }
    if (quantity > variant.available) {
      flash(`Only ${variant.available} left in this size`, false);
      return false;
    }
    const res = await addToBagAction(variant.id, quantity);
    flash(res.message, res.ok);
    if (res.ok) {
      router.refresh();
      setSizeError(false);
      return true;
    }
    return false;
  };

  const handleBuyNow = () => {
    startTransition(async () => {
      const added = await handleAdd();
      if (added) router.push("/checkout");
    });
  };

  const checkPin = () => {
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setPinResult({ ok: false, text: "Enter a valid 6-digit PIN code" });
      return;
    }
    setPinLoading(true);
    fetch(`/api/pincode?code=${encodeURIComponent(pin)}`)
      .then((r) => r.json())
      .then((data) => {
        setPinResult({ ok: data.serviceable, text: data.message ?? "Unable to check delivery" });
      })
      .catch(() => setPinResult({ ok: false, text: "Unable to check delivery right now" }))
      .finally(() => setPinLoading(false));
  };

  const off = percentOff(product.price, product.salePrice);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Gallery */}
      <div className="flex flex-col gap-3">
        <div
          className="relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden bg-sand"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setZoomPos({
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100,
            });
          }}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onTouchStart={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[imageIndex]?.url ?? product.images[0]?.url}
            alt={images[imageIndex]?.alt ?? product.name}
            className={cn("h-full w-full object-cover transition-transform duration-300", zoom && "scale-[1.7]")}
            style={zoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
          />
          {!zoom && (
            <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center bg-white/85 text-obsidian">
              <ZoomIn className="h-4 w-4" />
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="hide-scrollbar flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1}`}
                onClick={() => setImageIndex(i)}
                className={cn(
                  "h-20 w-16 shrink-0 overflow-hidden border bg-sand",
                  i === imageIndex ? "border-gold" : "border-line hover:border-obsidian",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-1.5">
          {product.isNewArrival && <Badge tone="gold">New</Badge>}
          {product.isBestSeller && <Badge tone="obsidian">Bestseller</Badge>}
          {product.isLimitedEdition && <Badge tone="obsidian">Limited Edition</Badge>}
          {off > 0 && <Badge tone="sale">{off}% Off</Badge>}
        </div>

        <div>
          <h1 className="font-display text-3xl sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-xs text-graphite">
            SKU: {variant?.sku ?? product.parentSku} · {product.categoryName}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <span className="font-display text-3xl">{formatINR(effectivePrice)}</span>
          {off > 0 && (
            <>
              <span className="text-lg text-graphite line-through">{formatINR(product.price)}</span>
              <span className="text-sm font-semibold text-danger">{off}% OFF</span>
            </>
          )}
          {pricePerUnit && <span className="text-xs text-graphite">MRP inclusive of GST</span>}
        </div>

        {product.reviewCount > 0 && (
          <Link href="#reviews" className="flex items-center gap-1.5 text-sm text-graphite">
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-gold text-gold" : "text-line")} />
              ))}
            </span>
            {product.rating.toFixed(1)} ({product.reviewCount} reviews)
          </Link>
        )}

        {/* Colour */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-graphite">
            Colour: <span className="text-obsidian">{color}</span>
          </span>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c.color}
                type="button"
                aria-label={`Select colour ${c.color}`}
                aria-pressed={c.color === color}
                onClick={() => {
                  setColor(c.color);
                  setSize(null);
                  setSizeError(false);
                }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2",
                  c.color === color ? "border-gold" : "border-line hover:border-charcoal",
                )}
              >
                <span className="h-6 w-6 rounded-full border border-line/50" style={{ background: c.hex ?? "#ccc" }} />
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-graphite">
              {size ? `Size: ${size}` : "Select size"}
            </span>
            <button type="button" onClick={() => setSizeGuideOpen(true)} className="link-underline text-xs text-graphite">
              Size guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select size">
            {sizesForColor.map((v) => {
              const soldOut = v.available <= 0;
              return (
                <button
                  key={v.size}
                  type="button"
                  role="radio"
                  aria-checked={size === v.size}
                  disabled={soldOut}
                  onClick={() => {
                    setSize(v.size);
                    setSizeError(false);
                  }}
                  className={cn(
                    "flex h-11 min-w-11 items-center justify-center border px-3 text-sm",
                    soldOut
                      ? "cursor-not-allowed border-line text-graphite/40 line-through"
                      : size === v.size
                        ? "border-obsidian bg-obsidian text-ivory"
                        : "border-line hover:border-obsidian",
                  )}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
          {sizeError && (
            <p role="alert" className="text-xs text-danger">
              Please select a size before adding to bag.
            </p>
          )}
          {variant && variant.available <= 5 && variant.available > 0 && (
            <p className="text-xs text-danger">Hurry — only {variant.available} left in this size.</p>
          )}
          {!variant && sizesForColor.length === 0 && (
            <p className="text-xs text-danger">This colour is currently unavailable.</p>
          )}
        </div>

        {/* Quantity + CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 border border-line bg-white">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 hover:text-gold">
              <Minus className="h-4 w-4" />
            </button>
            <span className="flex w-10 items-center justify-center text-sm" aria-live="polite">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(variant?.available ?? 99, q + 1))}
              className="px-3 hover:text-gold"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => { await handleAdd(); })}
            className="h-11 flex-1 bg-obsidian px-6 text-xs font-medium uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-charcoal disabled:opacity-60 min-w-40"
          >
            {pending ? "Adding…" : "Add to Bag"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleBuyNow}
            className="h-11 flex-1 bg-gold px-6 text-xs font-medium uppercase tracking-[0.2em] text-obsidian transition-colors hover:bg-gold-deep hover:text-ivory disabled:opacity-60 min-w-40"
          >
            Buy Now
          </button>
          <WishlistButton productId={product.id} />
        </div>

        {message && (
          <p role="status" className={cn("text-sm", message.ok ? "text-success" : "text-danger")}>
            {message.text}
          </p>
        )}

        {/* Delivery check */}
        <div className="border border-line bg-white p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-graphite">
            Check delivery & COD
          </p>
          <div className="flex gap-2">
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter PIN code"
              inputMode="numeric"
              aria-label="PIN code"
              className="h-10 w-40 border border-line bg-ivory px-3 text-sm focus:border-obsidian focus:outline-none"
            />
            <button type="button" onClick={checkPin} disabled={pinLoading} className="h-10 border border-obsidian px-4 text-[10px] font-semibold uppercase tracking-[0.16em]">
              {pinLoading ? "…" : "Check"}
            </button>
          </div>
          {pinResult && (
            <p className={cn("mt-2 text-xs", pinResult.ok ? "text-success" : "text-danger")}>{pinResult.text}</p>
          )}
        </div>

        {/* Assurance */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Truck, label: "Dispatch in 48h" },
            { icon: RotateCcw, label: "7-day returns" },
            { icon: ShieldCheck, label: "Secure payment" },
          ].map((a) => (
            <div key={a.label} className="flex flex-col items-center gap-2 border border-line bg-white py-4 text-center">
              <a.icon className="h-4 w-4 text-gold" />
              <span className="text-[10px] uppercase tracking-[0.14em] text-graphite">{a.label}</span>
            </div>
          ))}
        </div>

        {/* Accordions */}
        <div className="flex flex-col divide-y divide-line border-y border-line">
          {[
            { title: "Description", body: product.description || "Crafted with considered construction and premium cloth. A MAISON HOMME essential." },
            { title: "Fabric & Care", body: [product.fabric && `Fabric: ${product.fabric}`, product.fit && `Fit: ${product.fit}`, product.occasion && `Occasion: ${product.occasion}`, product.careInstructions && `Care: ${product.careInstructions}`].filter(Boolean).join(" · ") },
            { title: "Shipping & Returns", body: "Ships within 48 hours. Free shipping above ₹1,499. 7-day returns on unused items with tags intact." },
          ].map((item) => (
            <details key={item.title} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em]">
                {item.title}
                <Plus className="h-4 w-4 text-gold transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-graphite">{item.body}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Size guide modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-obsidian/60 p-4" role="dialog" aria-modal="true" aria-label="Size guide">
          <div className="w-full max-w-lg bg-ivory p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl">Size Guide</h2>
              <button type="button" onClick={() => setSizeGuideOpen(false)} className="p-2" aria-label="Close size guide">
                ✕
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-graphite">
                  <th className="py-2">Size</th>
                  <th>Chest (in)</th>
                  <th>Waist (in)</th>
                  <th>Shoulder (in)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(SIZE_GUIDE).map(([s, m]) => (
                  <tr key={s} className={cn("border-b border-line", size === s && "bg-sand")}>
                    <td className="py-2 font-medium">{s}</td>
                    <td>{m.chest}</td>
                    <td>{m.waist}</td>
                    <td>{m.shoulder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-graphite">Measurements are garment measurements in inches. Unsure? Chat with our concierge.</p>
          </div>
        </div>
      )}
      <span className="sr-only"><Check /></span>
    </div>
  );
}