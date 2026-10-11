import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AddressForm } from "@/components/store/address-form";
import { deleteAddressAction, setDefaultAddressAction } from "@/lib/actions/account";
import { Badge } from "@/components/ui";

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Addresses</h1>
      <AddressForm />
      {addresses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 border border-line bg-white p-5 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{a.fullName}</span>
                <div className="flex gap-2">
                  {a.isDefault && <Badge tone="gold">Default</Badge>}
                  <Badge tone="muted">{a.type}</Badge>
                </div>
              </div>
              <p className="text-graphite">
                {a.line1}{a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.city}, {a.state} {a.pincode}
                <br />
                {a.phone}
              </p>
              <div className="mt-auto flex items-center gap-4 pt-2 text-xs">
                {!a.isDefault && (
                  <form action={setDefaultAddressAction.bind(null, a.id)}>
                    <button className="text-graphite underline" type="submit">Set default</button>
                  </form>
                )}
                <form action={deleteAddressAction.bind(null, a.id)}>
                  <button className="text-danger underline" type="submit">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}