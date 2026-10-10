import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { StatefulForm, SubmitButton } from "@/components/forms";
import { requireUser } from "@/lib/auth";
import { getMyClasses, getRecentAttempts } from "@/lib/queries";
import { createClassroom, joinClassroom } from "@/app/actions/classroom";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Kelas saya" };

export default async function Dashboard() {
  const user = await requireUser();
  const [classes, recent] = await Promise.all([getMyClasses(user.id), getRecentAttempts(user.id)]);
  const firstName = user.name.split(" ")[0];

  return (
    <AppShell>
      <h1 className="text-4xl font-extrabold">Halo, {firstName}.</h1>
      <p className="mt-2 text-graphite">
        {classes.length ? "Pilih kelas untuk menulis soal atau mulai latihan." : "Mulai dengan bergabung ke kelas temanmu atau buat kelas baru."}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-xl font-bold">Gabung dengan kode</h2>
          <p className="mt-1 text-sm text-graphite">Minta kode 6 karakter dari pembuat kelas.</p>
          <StatefulForm action={joinClassroom} className="mt-4">
            <label htmlFor="code" className="sr-only">Kode kelas</label>
            <div className="flex gap-2">
              <input id="code" name="code" maxLength={6} placeholder="Contoh: K7QM2P" autoComplete="off"
                className="field font-display uppercase tracking-[0.2em]" />
              <SubmitButton pendingText="Mencari…">Gabung</SubmitButton>
            </div>
          </StatefulForm>
        </section>
        <section className="panel p-5">
          <h2 className="text-xl font-bold">Buat kelas baru</h2>
          <p className="mt-1 text-sm text-graphite">Kamu akan menjadi pemilik dan mendapat kode undangan.</p>
          <StatefulForm action={createClassroom} className="mt-4 space-y-3">
            <div>
              <label htmlFor="name" className="sr-only">Nama kelas</label>
              <input id="name" name="name" placeholder="Contoh: Struktur Data, Kelas IF-A" className="field" />
            </div>
            <div>
              <label htmlFor="description" className="sr-only">Deskripsi</label>
              <input id="description" name="description" placeholder="Deskripsi singkat (opsional)" className="field" />
            </div>
            <SubmitButton pendingText="Membuat…">Buat kelas</SubmitButton>
          </StatefulForm>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Kelas saya</h2>
        {classes.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-graphite">
            Kamu belum tergabung di kelas mana pun. Gunakan salah satu form di atas.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <li key={c.id}>
                <Link href={`/kelas/${c.id}`} className="panel block h-full p-5 transition-colors hover:border-ink">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold">{c.name}</h3>
                    {c.role === "OWNER" && <span className="shrink-0 rounded-full bg-ljk-soft px-2 py-0.5 text-xs font-semibold text-ljk">Pemilik</span>}
                  </div>
                  {c.description && <p className="mt-1 line-clamp-2 text-sm text-graphite">{c.description}</p>}
                  <p className="mt-4 text-sm text-graphite">{c.memberCount} anggota, {c.setCount} bank soal</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold">Latihan terakhir</h2>
          <ul className="panel mt-4 divide-y divide-line">
            {recent.map((a) => (
              <li key={a.id}>
                <Link href={`/hasil/${a.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-paper">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.setTitle}</p>
                    <p className="truncate text-sm text-graphite">{a.classroomName}, {formatDate(a.createdAt)}</p>
                  </div>
                  <span className="shrink-0 font-display text-lg font-bold">{a.score}/{a.total}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
