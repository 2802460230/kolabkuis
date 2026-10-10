import Link from "next/link";
import { Nav } from "@/components/Nav";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-display text-6xl font-extrabold text-ljk">404</p>
        <h1 className="mt-4 text-3xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-graphite">Halaman ini tidak ada, atau kamu belum menjadi anggota kelas tersebut.</p>
        <Link href="/dashboard" className="btn-primary mt-6">Ke kelas saya</Link>
      </main>
    </>
  );
}
