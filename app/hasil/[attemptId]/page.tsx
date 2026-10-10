import Link from "next/link";
import type { Metadata } from "next";
import { and, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, attempts, attemptAnswers, questions, questionSets } from "@/db";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { LETTERS } from "@/lib/format";
import { POINTS } from "@/lib/queries";

export const metadata: Metadata = { title: "Hasil kuis" };

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const user = await requireUser();
  // Hasil hanya bisa dilihat pemiliknya
  const attempt = await db.query.attempts.findFirst({ where: and(eq(attempts.id, attemptId), eq(attempts.userId, user.id)) });
  if (!attempt) notFound();
  const set = (await db.query.questionSets.findFirst({ where: eq(questionSets.id, attempt.setId) }))!;

  const [answers, qs] = await Promise.all([
    db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId)),
    attempt.questionIds.length ? db.select().from(questions).where(inArray(questions.id, attempt.questionIds)) : Promise.resolve([]),
  ]);
  const byId = new Map(qs.map((q) => [q.id, q]));
  const ansById = new Map(answers.map((a) => [a.questionId, a]));
  const total = attempt.questionIds.length;
  const pct = total ? Math.round((attempt.score / total) * 100) : 0;
  const review = attempt.questionIds
    .map((id) => ({ q: byId.get(id), a: ansById.get(id) }))
    .filter((r): r is { q: NonNullable<typeof r.q>; a: typeof r.a } => !!r.q && !r.a?.correct);

  const verdict = pct >= 80 ? "Siap ujian." : pct >= 60 ? "Sudah cukup baik, ulangi bagian yang salah." : "Pelajari pembahasan di bawah, lalu coba lagi.";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link href={`/kelas/${set.classroomId}/bank/${set.id}`} className="text-sm font-semibold text-graphite hover:text-ink">{set.title}</Link>
        <section className="panel mt-4 p-6 text-center sm:p-8">
          <p className="font-display text-7xl font-extrabold">{attempt.score}<span className="text-graphite">/{total}</span></p>
          <p className="mt-2 text-xl font-bold">{pct}% benar. {verdict}</p>
          <p className="mt-1 text-graphite">Kamu mendapat {attempt.score * POINTS.correctAnswer} poin untuk papan peringkat kelas.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href={`/kuis/${set.id}`} className="btn-primary">Kerjakan lagi</Link>
            <Link href={`/kelas/${set.classroomId}/peringkat`} className="btn-ghost">Lihat peringkat</Link>
          </div>
        </section>

        {review.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold">Perlu dipelajari lagi ({review.length})</h2>
            <ul className="mt-4 space-y-3">
              {review.map(({ q, a }) => (
                <li key={q.id} className="panel p-5">
                  <p className="whitespace-pre-line font-bold">{q.prompt}</p>
                  {a ? (
                    <p className="mt-3 text-sm"><span className="font-semibold text-salah">Jawabanmu: {LETTERS[a.chosenIndex]}. {q.options[a.chosenIndex]}</span></p>
                  ) : (
                    <p className="mt-3 text-sm font-semibold text-graphite">Tidak dijawab</p>
                  )}
                  <p className="mt-1 text-sm font-semibold text-benar">Jawaban benar: {LETTERS[q.correctIndex]}. {q.options[q.correctIndex]}</p>
                  <p className="mt-3 whitespace-pre-line rounded-lg bg-paper p-3 text-[15px]">{q.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
