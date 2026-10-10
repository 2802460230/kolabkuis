import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { Logo } from "./Logo";

export async function Nav() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-line bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 sticky top-0 z-20">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo href={user ? "/dashboard" : "/"} />
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard" className="hidden text-sm font-semibold text-graphite hover:text-ink sm:inline">Kelas saya</Link>
            <span className="hidden max-w-[12rem] truncate text-sm text-graphite md:inline">{user.name}</span>
            <form action={logout}>
              <button className="btn-ghost btn-sm">Keluar</button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/masuk" className="btn-ghost btn-sm">Masuk</Link>
            <Link href="/daftar" className="btn-primary btn-sm">Daftar gratis</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
