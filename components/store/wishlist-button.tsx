"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "@/lib/actions/wishlist";

export function WishlistButton({
  productId,
  initiallySaved = false,
  className,
}: {
  productId: string;
  initiallySaved?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      disabled={pending}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-obsidian shadow-sm transition-colors hover:bg-white",
        className,
      )}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleWishlistAction(productId);
          if (res.requiresAuth) {
            router.push("/account/login?next=/wishlist");
            return;
          }
          if (res.ok) setSaved(!!res.added);
        })
      }
    >
      <Heart className={cn("h-4 w-4", saved && "fill-danger text-danger")} />
    </button>
  );
}
