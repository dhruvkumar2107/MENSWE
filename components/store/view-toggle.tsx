"use client";

import { useState } from "react";
import { LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ViewToggle({
  grid,
  list,
  count,
}: {
  grid: React.ReactNode;
  list: React.ReactNode;
  count: number;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-xs text-graphite">
          <span className="font-medium text-obsidian">{count}</span> products
        </p>
        <div className="flex border border-line">
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
            className={cn("flex h-9 w-9 items-center justify-center", view === "grid" ? "bg-obsidian text-ivory" : "bg-white text-graphite")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={cn("flex h-9 w-9 items-center justify-center", view === "list" ? "bg-obsidian text-ivory" : "bg-white text-graphite")}
          >
            <Rows3 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {view === "grid" ? grid : <div className="flex flex-col gap-4">{list}</div>}
    </div>
  );
}