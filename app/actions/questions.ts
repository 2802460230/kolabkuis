"use server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, questions, questionSets, votes, reports } from "@/db";
import { requireMember } from "@/lib/auth";
import { questionSchema, reportSchema, firstError, type FormState } from "@/lib/validation";

function parseQuestionForm(formData: FormData) {
  return questionSchema.safeParse({
    prompt: formData.get("prompt"),
    options: [0, 1, 2, 3].map((i) => String(formData.get(`option${i}`) ?? "")),
    correctIndex: formData.get("correctIndex") ?? -1,
    explanation: formData.get("explanation"),
    difficulty: formData.get("difficulty") ?? "SEDANG",
  });
}

// Memuat soal + konteks kelas, sekaligus memastikan user anggota kelas tsb.
async function loadQuestion(questionId: string) {
  const q = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
    with: { set: { columns: { id: true, classroomId: true } } },
  });
  if (!q) throw new Error("Soal tidak ditemukan");
  const ctx = await requireMember(q.set.classroomId);
  return { q, ...ctx, path: `/kelas/${q.set.classroomId}/bank/${q.set.id}` };
}

export async function createQuestion(setId: string, _: FormState, formData: FormData): Promise<FormState> {
  const set = await db.query.questionSets.findFirst({ where: eq(questionSets.id, setId) });
  if (!set) return { error: "Bank soal tidak ditemukan." };
  const { user } = await requireMember(set.classroomId);

  const parsed = parseQuestionForm(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  await db.insert(questions).values({ ...parsed.data, setId, authorId: user.id });
  const path = `/kelas/${set.classroomId}/bank/${setId}`;
  revalidatePath(path);
  if (formData.get("lagi") === "1") return { ok: true, message: "Soal tersimpan. Silakan tulis soal berikutnya." };
  redirect(path);
}

export async function updateQuestion(questionId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { q, user, path } = await loadQuestion(questionId);
  if (q.authorId !== user.id) return { error: "Hanya penulis soal yang bisa mengubahnya." };

  const parsed = parseQuestionForm(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  await db.update(questions).set(parsed.data).where(eq(questions.id, questionId));
  // Soal sudah diperbaiki: laporan lama dianggap selesai
  await db.update(reports).set({ resolved: true }).where(eq(reports.questionId, questionId));
  revalidatePath(path);
  redirect(path);
}

export async function deleteQuestion(questionId: string) {
  const { q, user, isOwner, path } = await loadQuestion(questionId);
  if (q.authorId !== user.id && !isOwner) return;
  await db.delete(questions).where(eq(questions.id, questionId));
  revalidatePath(path);
}

// Vote: klik tombol yang sama dua kali = batalkan vote
export async function voteQuestion(questionId: string, value: 1 | -1) {
  const { q, user, path } = await loadQuestion(questionId);
  if (value !== 1 && value !== -1) return;
  // Penulis tidak boleh menilai soalnya sendiri (dicek di server, bukan hanya tombol yang dinonaktifkan)
  if (q.authorId === user.id) return;
  const existing = await db.query.votes.findFirst({
    where: and(eq(votes.userId, user.id), eq(votes.questionId, questionId)),
  });
  if (existing?.value === value) {
    await db.delete(votes).where(and(eq(votes.userId, user.id), eq(votes.questionId, questionId)));
  } else {
    await db.insert(votes).values({ userId: user.id, questionId, value })
      .onConflictDoUpdate({ target: [votes.userId, votes.questionId], set: { value } });
  }
  revalidatePath(path);
}

export async function reportQuestion(questionId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { user, path } = await loadQuestion(questionId);
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await db.insert(reports).values({ questionId, userId: user.id, reason: parsed.data.reason })
    .onConflictDoUpdate({
      target: [reports.questionId, reports.userId],
      set: { reason: parsed.data.reason, resolved: false, createdAt: new Date() },
    });
  revalidatePath(path);
  return { ok: true, message: "Laporan terkirim. Terima kasih sudah menjaga kualitas soal." };
}

// Pemilik kelas menandai laporan sebagai selesai (soal dianggap sudah benar)
export async function resolveReports(questionId: string) {
  const { q, isOwner } = await loadQuestion(questionId);
  if (!isOwner) return;
  await db.update(reports).set({ resolved: true }).where(eq(reports.questionId, questionId));
  revalidatePath(`/kelas/${q.set.classroomId}/laporan`);
}
