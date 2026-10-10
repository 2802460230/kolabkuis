"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClassTabs({ base, isOwner, reportCount }: { base: string; isOwner: boolean; reportCount: number }) {
  const path = usePathname();
  const tabs = [
    { href: base, label: "Bank soal", active: path === base || path.startsWith(`${base}/bank`) },
    { href: `${base}/peringkat`, label: "Peringkat" },
    { href: `${base}/anggota`, label: "Anggota" },
    ...(isOwner ? [{ href: `${base}/laporan`, label: reportCount ? `Laporan (${reportCount})` : "Laporan" }] : []),
    { href: `${base}/pengaturan`, label: "Pengaturan" },
  ];
  return (
    <nav aria-label="Menu kelas" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {tabs.map((t) => {
          const active = "active" in t && t.active !== undefined ? t.active : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={active ? "page" : undefined}
                className={`-mb-px inline-block border-b-2 px-3 py-2.5 text-sm font-semibold ${active ? "border-ljk text-ink" : "border-transparent text-graphite hover:text-ink"}`}>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
