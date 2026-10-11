import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get("code") || "").trim();
  if (!/^[1-9][0-9]{5}$/.test(code)) {
    return Response.json({ valid: false, message: "Enter a valid 6-digit PIN code" });
  }
  const pincode = await prisma.pincode.findUnique({ where: { code } });
  if (!pincode || !pincode.isServiceable) {
    return Response.json({ valid: true, serviceable: false, message: "We don't deliver to this PIN code yet" });
  }
  return Response.json({
    valid: true,
    serviceable: true,
    codAvailable: pincode.codAvailable,
    etaDays: pincode.etaDays,
    city: pincode.city,
    state: pincode.state,
    message: `Delivery in ${pincode.etaDays} business days to ${pincode.city}, ${pincode.state}`,
  });
}