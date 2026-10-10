import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, questionSets } from "@/db";
import { requireMember } from "@/lib/auth";
import { getQuestionsForSet, HIDE_REPORTS, HIDE_SCORE } from "@/lib/queries";
import { QuestionCard } from "@/components/QuestionCard";
import { ConfirmButton, StatefulForm, SubmitButton } from "@/components/forms";
import { deleteSet, updateSet } from "@/app/actions/sets";

export default async function SetPage({ params }: { params: Promise<{ id: string; setId: string }> }) {
  const { id, setId } = await params;
  const { user, isOwner } = await requireMember(id);
  const set = await db.query.questionSets.findFirst({ where: and(eq(questionSets.id, setId), eq(questionSets.classroomId, id)) });
  if (!set) notFound();
  const qs = await getQuestionsForSet(setId, user.id);
  const active = qs.filter((q) => !q.hidden).length;
  const canManage = isOwner || set.createdById === user.id;
  const base = `/kelas/${id}/bank/${setId}`;

  return (
    <div>
      <Link href={`/kelas/${id}`} className="text-sm font-semibold text-graphite hover:text-ink">Semua bank soal</Link>
      <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h2 className="text-3xl font-bold">{set.title}</h2>
          {set.description && <p className="mt-2 max-w-prose text-graphite">{set.description}</p>}
          <p className="mt-2 text-sm text-graphite">{qs.length} soal, {active} aktif di kuis</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`${base}/soal/baru`} className="btn-ghost">Tulis soal</Link>
          {active > 0
            ? <Link href={`/kuis/${setId}`} className="btn-primary">Mulai kuis</Link>
            : <span className="btn-primary opacity-50" aria-disabled>Mulai kuis</span>}
        </div>
      </div>

      {canManage && (
        <details className="panel mt-6 p-4">
          <summary className="cursor-pointer font-semibold">Kelola bank soal</summary>
          <StatefulForm action={updateSet.bind(null, setId)} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label htmlFor="title" className="label">Judul</label>
              <input id="title" name="title" defaultValue={set.title} className="field" />
            </div>
            <div>
              <label htmlFor="description" className="label">Deskripsi</label>
              <input id="description" name="description" defaultValue={set.description ?? ""} className="field" />
            </div>
            <SubmitButton>Simpan</SubmitButton>
          </StatefulForm>
          <div className="mt-4 border-t border-line pt-4">
            <ConfirmButton action={deleteSet.bind(null, setId)} message={`Hapus bank soal "${set.title}" beserta ${qs.length} soalnya?`}>
              Hapus bank soal
            </ConfirmButton>
          </div>
        </details>
      )}

      <p className="mt-6 text-sm text-graphite">
        Soal diurutkan dari skor tertinggi. Soal dengan skor {HIDE_SCORE} atau {HIDE_REPORTS} laporan otomatis disembunyikan dari kuis.
      </p>

      {qs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line p-8 text-center">
          <p className="text-graphite">Bank soal ini masih kosong.</p>
          <Link href={`${base}/soal/baru`} className="btn-primary mt-4">Tulis soal pertama</Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {qs.map((q, i) => (
            <QuestionCard key={q.id} q={q} index={i} userId={user.id} isOwner={isOwner} editHref={`${base}/soal/${q.id}/edit`} />
          ))}
        </div>
      )}
    </div>
  );
}
