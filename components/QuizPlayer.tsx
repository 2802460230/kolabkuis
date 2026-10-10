"use client";
import { useEffect, useState, useTransition } from "react";
import { startQuiz, answerQuestion, finishQuiz, type QuizQuestion } from "@/app/actions/quiz";
import { DIFFICULTY_LABEL, LETTERS } from "@/lib/format";

type Feedback = { correct: boolean; chosenIndex: number; correctIndex: number; explanation: string };

export function QuizPlayer({ setId, setTitle, available }: { setId: string; setTitle: string; available: number }) {
  const [count, setCount] = useState(Math.min(10, available));
  const [session, setSession] = useState<{ attemptId: string; questions: QuizQuestion[] } | null>(null);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const q = session?.questions[index];
  const isLast = session ? index === session.questions.length - 1 : false;

  function begin() {
    setError(null);
    startTransition(async () => {
      const res = await startQuiz(setId, count);
      if ("error" in res) setError(res.error ?? "Gagal memulai kuis");
      else setSession(res);
    });
  }

  function choose(i: number) {
    if (!session || !q || feedback || pending) return;
    startTransition(async () => {
      try {
        const res = await answerQuestion(session.attemptId, q.id, i);
        setFeedback(res);
        if (res.correct) setScore((s) => s + 1);
      } catch {
        setError("Jawaban gagal dikirim. Periksa koneksi lalu coba lagi.");
      }
    });
  }

  function next() {
    if (!session) return;
    if (isLast) {
      startTransition(() => finishQuiz(session.attemptId));
    } else {
      setIndex((n) => n + 1);
      setFeedback(null);
      setError(null);
    }
  }

  // Pintasan keyboard: A–D atau 1–4 untuk memilih, Enter untuk lanjut
  useEffect(() => {
    if (!session) return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
      const k = e.key.toUpperCase();
      const idx = "ABCD".indexOf(k) >= 0 ? "ABCD".indexOf(k) : "1234".indexOf(k);
      if (idx >= 0 && !feedback) choose(idx);
      if (e.key === "Enter" && feedback) next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!session) {
    const options = [5, 10, 20].filter((n) => n < available);
    return (
      <div className="panel mx-auto max-w-xl p-6 sm:p-8">
        <h1 className="text-3xl font-bold">{setTitle}</h1>
        <p className="mt-2 text-graphite">
          {available} soal aktif. Soal diundi acak, dan setiap jawaban langsung diperiksa beserta pembahasannya.
        </p>
        <fieldset className="mt-6">
          <legend className="label">Jumlah soal</legend>
          <div className="flex flex-wrap gap-2">
            {[...options, available].map((n) => (
              <label key={n} className="cursor-pointer">
                <input type="radio" name="count" className="peer sr-only" checked={count === n} onChange={() => setCount(n)} />
                <span className="inline-block rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-ljk">
                  {n === available && !options.includes(n) ? `Semua (${n})` : n}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="mt-4 rounded-lg bg-salah-soft px-3 py-2 text-sm text-salah">{error}</p>}
        <button onClick={begin} disabled={pending} className="btn-primary mt-6 w-full py-3 text-base">
          {pending ? "Mengundi soal…" : "Mulai kuis"}
        </button>
        <p className="mt-3 text-center text-sm text-graphite">Tip: tekan A–D untuk menjawab dan Enter untuk lanjut.</p>
      </div>
    );
  }

  const total = session.questions.length;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm font-semibold text-graphite">
        <span>Soal {index + 1} dari {total}</span>
        <span>Skor {score}</span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (feedback ? 1 : 0)}>
        <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${((index + (feedback ? 1 : 0)) / total) * 100}%` }} />
      </div>

      <div className="panel p-5 sm:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-graphite">
          <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-semibold">{DIFFICULTY_LABEL[q!.difficulty]}</span>
          <span>Ditulis oleh {q!.authorName}</span>
        </div>
        <h1 className="whitespace-pre-line font-display text-xl font-semibold leading-snug sm:text-2xl">{q!.prompt}</h1>

        <ul className="mt-6 space-y-2.5" role="list">
          {q!.options.map((opt, i) => {
            const state = !feedback
              ? undefined
              : i === feedback.correctIndex ? "correct" : i === feedback.chosenIndex ? "wrong" : undefined;
            return (
              <li key={i}>
                <button type="button" onClick={() => choose(i)} disabled={!!feedback || pending}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors disabled:cursor-default ${
                    state === "correct" ? "border-benar bg-benar-soft" : state === "wrong" ? "border-salah bg-salah-soft" : "border-line hover:border-ink"}`}>
                  <span className="bubble" data-state={state}>{LETTERS[i]}</span>
                  <span className="font-semibold">{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div aria-live="polite">
          {error && <p role="alert" className="mt-4 rounded-lg bg-salah-soft px-3 py-2 text-sm text-salah">{error}</p>}
          {feedback && (
            <div className="mt-6 border-t border-line pt-5">
              <p className={`text-lg font-bold ${feedback.correct ? "text-benar" : "text-salah"}`}>
                {feedback.correct ? "Benar." : `Belum tepat. Jawaban yang benar ${LETTERS[feedback.correctIndex]}.`}
              </p>
              <p className="mt-2 whitespace-pre-line text-ink">{feedback.explanation}</p>
              <button onClick={next} disabled={pending} className="btn-primary mt-5" autoFocus>
                {isLast ? (pending ? "Menyimpan hasil…" : "Lihat hasil") : "Soal berikutnya"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
