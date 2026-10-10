import Link from "next/link";
import { voteQuestion, deleteQuestion, reportQuestion } from "@/app/actions/questions";
import { ConfirmButton, StatefulForm, SubmitButton } from "./forms";
import { DIFFICULTY_LABEL, LETTERS } from "@/lib/format";

type Q = {
  id: string; prompt: string; options: string[]; correctIndex: number; explanation: string; difficulty: string;
  authorId: string; authorName: string; score: number; openReports: number; myVote: number | null; myReport: boolean; hidden: boolean;
};

export function QuestionCard({ q, index, userId, isOwner, editHref }: { q: Q; index: number; userId: string; isOwner: boolean; editHref: string }) {
  const mine = q.authorId === userId;
  return (
    <article className={`panel flex gap-4 p-4 sm:p-5 ${q.hidden ? "border-dashed bg-paper" : ""}`} aria-labelledby={`q-${q.id}`}>
      {/* Kolom vote */}
      <div className="flex flex-col items-center gap-1" aria-label="Penilaian soal">
        <form action={voteQuestion.bind(null, q.id, 1)}>
          <button aria-label="Soal ini bagus" aria-pressed={q.myVote === 1} disabled={mine}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg leading-none disabled:opacity-40 ${q.myVote === 1 ? "border-benar bg-benar-soft text-benar" : "border-line hover:border-ink"}`}>
            ▲
          </button>
        </form>
        <span className="font-display text-lg font-bold" aria-label={`Skor ${q.score}`}>{q.score}</span>
        <form action={voteQuestion.bind(null, q.id, -1)}>
          <button aria-label="Soal ini kurang baik" aria-pressed={q.myVote === -1} disabled={mine}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg leading-none disabled:opacity-40 ${q.myVote === -1 ? "border-salah bg-salah-soft text-salah" : "border-line hover:border-ink"}`}>
            ▼
          </button>
        </form>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm text-graphite">
          <span>Soal {index + 1}</span>
          <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-semibold">{DIFFICULTY_LABEL[q.difficulty]}</span>
          <span>oleh {mine ? "kamu" : q.authorName}</span>
          {q.hidden && <span className="rounded-full bg-salah-soft px-2 py-0.5 text-xs font-semibold text-salah">Disembunyikan dari kuis</span>}
          {!q.hidden && q.openReports > 0 && <span className="text-xs font-semibold text-salah">{q.openReports} laporan</span>}
        </div>
        <h3 id={`q-${q.id}`} className="mt-2 whitespace-pre-line font-body text-lg font-bold leading-snug">{q.prompt}</h3>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {q.options.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-[15px]">
              <span className="mt-0.5 font-display font-bold text-ljk">{LETTERS[i]}.</span><span>{o}</span>
            </li>
          ))}
        </ul>

        <details className="mt-3 group">
          <summary className="cursor-pointer text-sm font-semibold text-ink underline-offset-4 hover:underline">Lihat kunci dan pembahasan</summary>
          <div className="mt-2 rounded-lg bg-benar-soft/60 p-3 text-[15px]">
            <p className="font-semibold text-benar">Jawaban: {LETTERS[q.correctIndex]}. {q.options[q.correctIndex]}</p>
            <p className="mt-1 whitespace-pre-line text-ink">{q.explanation}</p>
          </div>
        </details>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {mine && <Link href={editHref} className="btn-ghost btn-sm">Ubah</Link>}
          {(mine || isOwner) && (
            <ConfirmButton action={deleteQuestion.bind(null, q.id)} message="Hapus soal ini? Tindakan ini tidak bisa dibatalkan.">Hapus</ConfirmButton>
          )}
          {!mine && (
            q.myReport ? (
              <span className="text-sm text-graphite">Kamu sudah melaporkan soal ini.</span>
            ) : (
              <details className="w-full sm:w-auto">
                <summary className="btn-ghost btn-sm cursor-pointer list-none">Laporkan</summary>
                <StatefulForm action={reportQuestion.bind(null, q.id)} className="mt-2 flex flex-col gap-2 sm:w-96">
                  <label htmlFor={`r-${q.id}`} className="label">Apa yang salah dengan soal ini?</label>
                  <input id={`r-${q.id}`} name="reason" className="field" placeholder="Contoh: kunci jawaban seharusnya C" />
                  <SubmitButton className="btn-primary btn-sm self-start" pendingText="Mengirim…">Kirim laporan</SubmitButton>
                </StatefulForm>
              </details>
            )
          )}
        </div>
      </div>
    </article>
  );
}
