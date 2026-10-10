import Link from "next/link";
import { Nav } from "@/components/Nav";
import { HeroDemo } from "@/components/HeroDemo";
import { getCurrentUser } from "@/lib/auth";

const STEPS = [
  { title: "Buat kelas", body: "Satu kelas per mata kuliah. Bagikan kode 6 karakter ke teman atau dosen." },
  { title: "Tulis soal bersama", body: "Setiap anggota menyumbang soal pilihan ganda lengkap dengan kunci dan pembahasannya." },
  { title: "Saling menilai", body: "Soal bagus dapat suara naik. Soal keliru bisa dilaporkan dan otomatis disembunyikan dari kuis." },
  { title: "Latihan dan bersaing", body: "Kerjakan kuis acak dengan umpan balik langsung, lalu lihat posisimu di papan peringkat kelas." },
];

export default async function Landing() {
  const user = await getCurrentUser();
  const cta = user ? { href: "/dashboard", label: "Buka kelas saya" } : { href: "/daftar", label: "Buat akun gratis" };

  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[1.05fr_1fr] md:gap-14 md:pt-16">
          <div>
            <h1 className="text-[2.6rem] font-extrabold text-ink sm:text-6xl">
              Bank soal yang ditulis bareng teman sekelas.
            </h1>
            <p className="mt-5 max-w-prose text-lg text-graphite">
              KolabKuis mengubah catatan kuliah jadi latihan soal. Setiap anggota kelas menulis soal,
              menilai soal teman, lalu berlatih lewat kuis interaktif yang langsung menjelaskan jawaban yang benar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={cta.href} className="btn-primary px-6 py-3 text-base">{cta.label}</Link>
              {!user && <Link href="/masuk" className="btn-ghost px-6 py-3 text-base">Saya sudah punya akun</Link>}
            </div>
          </div>
          <HeroDemo />
        </section>

        {/* Cara kerja: urutan nyata, jadi memakai nomor */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="max-w-xl text-3xl font-bold sm:text-4xl">Dari satu soal jadi ratusan, dalam satu semester.</h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative">
                  <span className="bubble mb-4" data-state={i === 0 ? "filled" : undefined}>{i + 1}</span>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-graphite">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Nilai kolaborasi */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Kualitas soal dijaga oleh kelas itu sendiri.</h2>
            <p className="mt-4 max-w-prose text-graphite">
              Tidak ada satu orang yang harus memeriksa semua soal. Suara dari anggota kelas mengurutkan soal terbaik ke atas,
              dan soal yang mendapat <span className="marker font-semibold text-ink">tiga laporan atau skor −3</span> otomatis
              keluar dari kuis sampai penulisnya memperbaiki.
            </p>
            <p className="mt-4 max-w-prose text-graphite">
              Menulis soal juga dihitung. Papan peringkat memberi poin untuk jawaban benar, soal yang ditulis,
              dan suara naik yang diterima, jadi yang rajin berbagi ikut naik peringkat.
            </p>
          </div>
          <div className="panel divide-y divide-line">
            {[
              { name: "Rani", detail: "18 soal ditulis, 41 jawaban benar", pts: 538 },
              { name: "Bima", detail: "6 soal ditulis, 47 jawaban benar", pts: 520 },
              { name: "Sekar", detail: "11 soal ditulis, 30 jawaban benar", pts: 389 },
            ].map((r, i) => (
              <div key={r.name} className="flex items-center gap-4 px-5 py-4">
                <span className="bubble" data-state={i === 0 ? "filled" : undefined}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.name}</p>
                  <p className="truncate text-sm text-graphite">{r.detail}</p>
                </div>
                <span className="font-display text-xl font-bold">{r.pts}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-ink text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
            <h2 className="max-w-xl text-3xl font-bold">Ujian berikutnya lebih ringan kalau belajarnya bareng.</h2>
            <Link href={cta.href} className="btn bg-marker px-6 py-3 text-base text-ink hover:bg-white">{cta.label}</Link>
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-graphite sm:px-6">
        KolabKuis dikembangkan oleh Tim Bai untuk Lomba Pemrograman Web Dinamis ICOM 2026.
      </footer>
    </>
  );
}
