import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, questionSets } from "@/db";
import { requireMember } from "@/lib/auth";
import { QuestionForm } from "@/components/QuestionForm";
import { createQuestion } from "@/app/actions/questions";

export default async function NewQuestion({ params }: { params: Promise<{ id: string; setId: string }> }) {
  const { id, setId } = await params;
  await requireMember(id);
  const set = await db.query.questionSets.findFirst({ where: and(eq(questionSets.id, setId), eq(questionSets.classroomId, id)) });
  if (!set) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold">Tulis soal untuk “{set.title}”</h2>
      <p className="mt-1 text-graphite">Soal yang jelas dan pembahasan yang lengkap biasanya dapat suara naik dari teman.</p>
      <div className="panel mt-6 p-5 sm:p-6">
        <QuestionForm mode="create" action={createQuestion.bind(null, setId)} cancelHref={`/kelas/${id}/bank/${setId}`} />
      </div>
    </div>
  );
}
