import { prisma } from "@/lib/db";
import { getSettings, boolSetting } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { cartCount } from "@/lib/cart";
import { readCartToken } from "@/lib/cart";
import { getWishlistProductIds } from "@/lib/actions/wishlist";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { Header, type NavCategory } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { AnalyticsBeacon } from "@/components/store/analytics-beacon";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);

  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });

  const navCategories: NavCategory[] = categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
    children: c.children.map((child) => ({ name: child.name, slug: child.slug })),
  }));

  const [count, token, wishlistIds] = await Promise.all([
    cartCount(await readCartToken()),
    readCartToken(),
    user ? getWishlistProductIds(user.id) : Promise.resolve([]),
  ]);

  const messages = (settings["announcement.messages"] || "").split("|").map((m) => m.trim());

  return (
    <>
      {boolSetting(settings, "announcement.enabled", true) && <AnnouncementBar messages={messages} />}
      <Header
        brandName={settings["brand.name"]}
        categories={navCategories}
        cartCount={count}
        wishlistCount={wishlistIds.length}
        userName={user ? user.name.split(" ")[0] : null}
      />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <AnalyticsBeacon />
    </>
  );
}
