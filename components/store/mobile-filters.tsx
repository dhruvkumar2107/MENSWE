"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileFilters({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 border border-line bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.18em]"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filter & Sort
      </button>

      <div className={cn("fixed inset-0 z-[70] lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
        <div
          className={cn("absolute inset-0 bg-obsidian/50 transition-opacity", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-ivory transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-line bg-ivory px-5 py-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Filter & Sort</span>
            <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="p-2">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </aside>
      </div>
    </div>
  );
}