import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { getSetsForClass } from "@/lib/queries";
import { StatefulForm, SubmitButton } from "@/components/forms";
import { createSet } from "@/app/actions/sets";
import { formatDate } from "@/lib/format";

export default async function ClassSets({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireMember(id);
  const sets = await getSetsForClass(id);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <section>
        <h2 className="text-2xl font-bold">Bank soal</h2>
        <p className="mt-1 text-graphite">Satu bank soal biasanya satu bab atau satu topik ujian.</p>
        {sets.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-graphite">
            Belum ada bank soal. Buat yang pertama lewat form di samping, misalnya “Bab 3: Stack dan Queue”.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {sets.map((s) => (
              <li key={s.id}>
                <Link href={`/kelas/${id}/bank/${s.id}`} className="panel flex flex-col gap-3 p-5 transition-colors hover:border-ink sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold">{s.title}</h3>
                    {s.description && <p className="mt-1 line-clamp-2 text-sm text-graphite">{s.description}</p>}
                    <p className="mt-2 text-sm text-graphite">Dibuat {s.creatorName}, {formatDate(s.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-6 text-sm">
                    <div><span className="block font-display text-2xl font-bold">{s.questionCount}</span><span className="text-graphite">soal</span></div>
                    <div><span className="block font-display text-2xl font-bold">{s.contributorCount}</span><span className="text-graphite">penulis</span></div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <aside>
        <div className="panel p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Bank soal baru</h2>
          <StatefulForm action={createSet.bind(null, id)} className="mt-4 space-y-3">
            <div>
              <label htmlFor="title" className="label">Judul</label>
              <input id="title" name="title" placeholder="Bab 3: Stack dan Queue" className="field" />
            </div>
            <div>
              <label htmlFor="description" className="label">Deskripsi <span className="font-normal text-graphite">(opsional)</span></label>
              <textarea id="description" name="description" rows={3} className="field" placeholder="Cakupan materi, untuk UTS, dll." />
            </div>
            <SubmitButton className="btn-primary w-full" pendingText="Membuat…">Buat bank soal</SubmitButton>
          </StatefulForm>
        </div>
      </aside>
    </div>
  );
}
