import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { moderateReviewAction } from "@/lib/actions/admin";
import { ReviewReplyForm } from "@/components/admin/return-controls";
import { StatusPill } from "@/components/admin/status-pill";
import { Star } from "lucide-react";

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin("review:read");
  const { status = "PENDING" } = await searchParams;

  const reviews = await prisma.review.findMany({
    where: status === "ALL" ? undefined : { status },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: { select: { name: true, slug: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Reviews</h1>
        <div className="flex gap-2">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
            <a key={s} href={`/admin/reviews?status=${s}`} className={`h-9 border px-3 text-[10px] font-semibold uppercase leading-9 tracking-[0.12em] ${status === s ? "border-obsidian bg-obsidian text-ivory" : "border-[#d9d2c6]"}`}>{s}</a>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {reviews.map((r) => (
          <div key={r.id} className="flex flex-col gap-3 border border-[#e4ded4] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-[#d9d2c6]"}`} />
                  ))}
                </span>
                <span className="font-medium">{r.title ?? "Untitled"}</span>
                <span className="text-xs text-[#6b655c]">{r.authorName} · {r.product.name}</span>
              </div>
              <StatusPill value={r.status} />
            </div>
            <p className="text-sm text-[#6b655c]">{r.body}</p>
            <ReviewReplyForm id={r.id} adminReply={r.adminReply} />
            <div className="flex gap-3">
              {r.status !== "APPROVED" && (
                <form action={moderateReviewAction.bind(null, r.id, "APPROVED")}>
                  <button type="submit" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 underline">Approve</button>
                </form>
              )}
              {r.status !== "REJECTED" && (
                <form action={moderateReviewAction.bind(null, r.id, "REJECTED")}>
                  <button type="submit" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-600 underline">Reject</button>
                </form>
              )}
              <a href={`/product/${r.product.slug}`} className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b655c] underline">View product</a>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="border border-[#e4ded4] bg-white p-6 text-sm text-[#6b655c]">No reviews in this state.</p>}
      </div>
    </div>
  );
}