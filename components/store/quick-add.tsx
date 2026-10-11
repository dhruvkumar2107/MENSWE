"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToBagAction } from "@/lib/actions/cart";

type Variant = { id: string; size: string; color: string; available: number };

export function QuickAdd({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sizes = Array.from(new Set(variants.map((v) => v.size)));

  const handleAdd = (variant: Variant) => {
    startTransition(async () => {
      const res = await addToBagAction(variant.id, 1);
      setMessage(res.message);
      if (res.ok) {
        setOpen(false);
        router.refresh();
        setTimeout(() => setMessage(null), 2500);
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-obsidian/90 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-obsidian"
      >
        Quick Add
      </button>
    );
  }

  return (
    <div className="bg-white/95 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-graphite">
          Select size
        </span>
        <button type="button" onClick={() => setOpen(false)} className="text-[9px] uppercase text-graphite">
          Close
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {sizes.map((size) => {
          const variant = variants.find((v) => v.size === size && v.available > 0);
          const soldOut = !variant;
          return (
            <button
              key={size}
              type="button"
              disabled={soldOut || pending}
              onClick={() => variant && handleAdd(variant)}
              className={
                soldOut
                  ? "cursor-not-allowed border border-line px-2 py-1 text-[10px] text-graphite/40 line-through"
                  : "border border-line px-2 py-1 text-[10px] hover:border-obsidian hover:bg-obsidian hover:text-ivory"
              }
            >
              {size}
            </button>
          );
        })}
      </div>
      {message && <p className="mt-1.5 text-[10px] text-graphite">{message}</p>}
    </div>
  );
}
