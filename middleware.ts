import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Halaman yang wajib login
const PROTECTED = ["/dashboard", "/kelas", "/kuis", "/hasil"];
// Halaman yang tidak perlu dibuka lagi jika sudah login
const GUEST_ONLY = ["/masuk", "/daftar"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userId = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!userId && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = new URL("/masuk", req.url);
    url.searchParams.set("lanjut", pathname);
    return NextResponse.redirect(url);
  }
  if (userId && GUEST_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/kelas/:path*", "/kuis/:path*", "/hasil/:path*", "/masuk", "/daftar"],
};
