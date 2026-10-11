import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm, PasswordForm } from "@/components/store/profile-forms";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Profile</h1>
      <div className="max-w-xl">
        <p className="mb-4 text-xs uppercase tracking-[0.18em] text-graphite">Member since {user?.createdAt.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
        <ProfileForm name={user?.name ?? ""} phone={user?.phone ?? ""} marketingConsent={user?.marketingConsent ?? false} />
        <PasswordForm />
      </div>
    </div>
  );
}