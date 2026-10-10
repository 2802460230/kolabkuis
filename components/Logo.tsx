import Link from "next/link";

// Logo: lingkaran jawaban LJK yang sudah "diarsir"
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-display text-xl font-extrabold text-ink" aria-label="KolabKuis, beranda">
      <span aria-hidden className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-ljk">
        <span className="h-4 w-4 rounded-full bg-ink" />
      </span>
      KolabKuis
    </Link>
  );
}
