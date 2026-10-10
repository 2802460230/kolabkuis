import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, questionSets } from "@/db";
import { requireMember } from "@/lib/auth";
import { getQuestionsForSet } from "@/lib/queries";
import { AppShell } from "@/components/AppShell";
import { QuizPlayer } from "@/components/QuizPlayer";

export const metadata: Metadata = { title: "Kuis" };

export default async function QuizPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const set = await db.query.questionSets.findFirst({ where: eq(questionSets.id, setId) });
  if (!set) notFound();
  const { user } = await requireMember(set.classroomId);
  const available = (await getQuestionsForSet(setId, user.id)).filter((q) => !q.hidden).length;
  const back = `/kelas/${set.classroomId}/bank/${setId}`;

  return (
    <AppShell>
      <Link href={back} className="text-sm font-semibold text-graphite hover:text-ink">Kembali ke bank soal</Link>
      <div className="mt-6">
        {available === 0 ? (
          <div className="panel mx-auto max-w-xl p-8 text-center">
            <p className="text-graphite">Belum ada soal aktif untuk dikerjakan.</p>
            <Link href={`${back}/soal/baru`} className="btn-primary mt-4">Tulis soal</Link>
          </div>
        ) : (
          <QuizPlayer setId={setId} setTitle={set.title} available={available} />
        )}
      </div>
    </AppShell>
  );
}
