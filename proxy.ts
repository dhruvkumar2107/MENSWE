import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { STAFF_ROLES, type Role } from "@/lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const isStaffMember = !!session && STAFF_ROLES.includes(session.role as Role);

  if (pathname === "/admin/login") {
    return isStaffMember ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
  }

  if (!isStaffMember) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};