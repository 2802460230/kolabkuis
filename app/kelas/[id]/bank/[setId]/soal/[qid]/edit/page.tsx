import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, questions } from "@/db";
import { requireMember } from "@/lib/auth";
import { QuestionForm } from "@/components/QuestionForm";
import { updateQuestion } from "@/app/actions/questions";

export default async function EditQuestion({ params }: { params: Promise<{ id: string; setId: string; qid: string }> }) {
  const { id, setId, qid } = await params;
  const { user } = await requireMember(id);
  const q = await db.query.questions.findFirst({ where: and(eq(questions.id, qid), eq(questions.setId, setId)) });
  if (!q || q.authorId !== user.id) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold">Ubah soal</h2>
      <p className="mt-1 text-graphite">Menyimpan perubahan akan menutup laporan yang masuk untuk soal ini.</p>
      <div className="panel mt-6 p-5 sm:p-6">
        <QuestionForm mode="edit" action={updateQuestion.bind(null, qid)} initial={q} cancelHref={`/kelas/${id}/bank/${setId}`} />
      </div>
    </div>
  );
}
