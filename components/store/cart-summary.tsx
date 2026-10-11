"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { updateBagItemAction, removeBagItemAction } from "@/lib/actions/cart";
import type { CartLine } from "@/lib/cart";
import type { Totals } from "@/lib/pricing";
import { ButtonLink } from "@/components/ui";

export function CartSummary({ lines, totals }: { lines: CartLine[]; totals: Totals }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const changeQty = (line: CartLine, delta: number) => {
    const next = line.quantity + delta;
    if (next < 1) return;
    if (next > line.available) return;
    startTransition(async () => {
      await updateBagItemAction(line.id, next);
      router.refresh();
    });
  };

  const remove = (line: CartLine) => {
    startTransition(async () => {
      await removeBagItemAction(line.id);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {lines.map((line) => (
        <div key={line.id} className="flex gap-4 border border-line bg-white p-4">
          <Link href={`/product/${line.slug}`} className="block h-28 w-20 shrink-0 overflow-hidden bg-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={line.imageUrl!} alt={line.name} className="h-full w-full object-cover" />
          </Link>
          <div className="flex flex-1 flex-col justify-between gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/product/${line.slug}`} className="text-sm font-medium hover:text-gold">
                  {line.name}
                </Link>
                <p className="mt-0.5 text-xs text-graphite">
                  {line.color} · Size {line.size}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${line.name}`}
                onClick={() => remove(line)}
                disabled={pending}
                className="p-1 text-graphite hover:text-danger disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex h-8 border border-line bg-white">
                <button type="button" aria-label="Decrease" onClick={() => changeQty(line, -1)} disabled={pending} className="px-2.5 disabled:opacity-50">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="flex w-8 items-center justify-center text-sm">{line.quantity}</span>
                <button type="button" aria-label="Increase" onClick={() => changeQty(line, 1)} disabled={pending || line.quantity >= line.available} className="px-2.5 disabled:opacity-50">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {line.unitPrice < line.originalPrice && (
                  <span className="text-xs text-graphite line-through">{formatINR(line.originalPrice)}</span>
                )}
                <span className="text-sm font-semibold">{formatINR(line.unitPrice * line.quantity)}</span>
              </div>
            </div>
            {line.available <= 5 && line.available > 0 && (
              <p className="text-[11px] text-danger">Only {line.available} left in this size.</p>
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-3 bg-obsidian p-6 text-ivory">
        <div className="flex justify-between text-sm">
          <span className="text-ivory/70">Subtotal</span>
          <span>{formatINR(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-sm text-gold">
            <span>Discount</span>
            <span>−{formatINR(totals.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-ivory/70">Shipping</span>
          <span>{totals.shipping === 0 ? "Free" : formatINR(totals.shipping)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ivory/70">Taxes (incl.)</span>
          <span>{formatINR(totals.tax)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-ivory/20 pt-3 font-display text-2xl">
          <span>Total</span>
          <span>{formatINR(totals.total)}</span>
        </div>
        <ButtonLink href="/checkout" variant="gold" size="lg" className="mt-3">
          Proceed to Checkout
        </ButtonLink>
        <Link href="/collections/all" className="text-center text-[11px] uppercase tracking-[0.2em] text-ivory/60 hover:text-ivory">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}