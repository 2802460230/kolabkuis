"use server";
import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, attempts, attemptAnswers, questions, questionSets } from "@/db";
import { requireMember, requireUser } from "@/lib/auth";
import { getQuestionsForSet } from "@/lib/queries";

export type QuizQuestion = {
  id: string; prompt: string; options: string[]; difficulty: string; authorName: string;
};

// Memulai sesi kuis: mengundi soal aktif (tidak tersembunyi) secara acak.
// Kunci jawaban TIDAK ikut dikirim ke browser.
export async function startQuiz(setId: string, count: number) {
  const set = await db.query.questionSets.findFirst({ where: eq(questionSets.id, setId) });
  if (!set) throw new Error("Bank soal tidak ditemukan");
  const { user } = await requireMember(set.classroomId);

  const pool = (await getQuestionsForSet(setId, user.id)).filter((q) => !q.hidden);
  if (pool.length === 0) return { error: "Belum ada soal aktif di bank soal ini." as const };

  // Fisher–Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, Math.max(1, Math.min(count, 20)));

  const [attempt] = await db.insert(attempts)
    .values({ userId: user.id, setId, questionIds: picked.map((q) => q.id) })
    .returning({ id: attempts.id });

  const quizQuestions: QuizQuestion[] = picked.map((q) => ({
    id: q.id, prompt: q.prompt, options: q.options, difficulty: q.difficulty, authorName: q.authorName,
  }));
  return { attemptId: attempt.id, questions: quizQuestions };
}

// Memeriksa satu jawaban di server, lalu mengembalikan kunci + pembahasan
export async function answerQuestion(attemptId: string, questionId: string, chosenIndex: number) {
  const user = await requireUser();
  const attempt = await db.query.attempts.findFirst({
    where: and(eq(attempts.id, attemptId), eq(attempts.userId, user.id)),
  });
  if (!attempt || attempt.finishedAt) throw new Error("Sesi kuis tidak valid");
  if (!attempt.questionIds.includes(questionId)) throw new Error("Soal bukan bagian dari sesi ini");
  if (!Number.isInteger(chosenIndex) || chosenIndex < 0 || chosenIndex > 3) throw new Error("Pilihan tidak valid");

  const q = await db.query.questions.findFirst({ where: eq(questions.id, questionId) });
  if (!q) throw new Error("Soal sudah dihapus");

  const correct = q.correctIndex === chosenIndex;
  // Unique (attempt, question) mencegah satu soal dijawab dua kali
  const inserted = await db.insert(attemptAnswers)
    .values({ attemptId, questionId, chosenIndex, correct })
    .onConflictDoNothing()
    .returning({ id: attemptAnswers.id });

  if (inserted.length > 0 && correct) {
    await db.update(attempts).set({ score: sql`${attempts.score} + 1` }).where(eq(attempts.id, attemptId));
  }
  const existing = inserted.length === 0
    ? await db.query.attemptAnswers.findFirst({
        where: and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.questionId, questionId)),
      })
    : null;

  return {
    correct: existing ? existing.correct : correct,
    chosenIndex: existing ? existing.chosenIndex : chosenIndex,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  };
}

export async function finishQuiz(attemptId: string) {
  const user = await requireUser();
  await db.update(attempts).set({ finishedAt: new Date() })
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, user.id)));
  redirect(`/hasil/${attemptId}`);
}
