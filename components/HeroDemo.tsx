"use client";
import { useState } from "react";

// Contoh soal interaktif di landing page — persis seperti mode kuis di aplikasi
const Q = {
  prompt: "Struktur data apa yang bekerja dengan prinsip LIFO (Last In, First Out)?",
  options: ["Queue", "Stack", "Linked list", "Binary heap"],
  correct: 1,
  explanation: "Stack menambah dan mengambil elemen dari ujung yang sama (top), jadi elemen terakhir masuk adalah yang pertama keluar. Queue justru FIFO.",
};
const LETTERS = ["A", "B", "C", "D"];

export function HeroDemo() {
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = chosen !== null;

  return (
    <div className="panel relative p-5 shadow-[0_1px_0_#D9DEE8,0_18px_40px_-24px_rgba(23,35,64,.45)] sm:p-6">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-graphite">Struktur Data, soal 3 dari 10</span>
        <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-semibold text-graphite">Mudah</span>
      </div>
      <p className="mb-5 font-display text-xl font-semibold leading-snug text-ink">{Q.prompt}</p>
      <ul className="space-y-2.5" role="list">
        {Q.options.map((opt, i) => {
          const state = !answered ? "idle" : i === Q.correct ? "correct" : i === chosen ? "wrong" : "idle";
          return (
            <li key={opt}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setChosen(i)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  state === "correct" ? "border-benar bg-benar-soft" : state === "wrong" ? "border-salah bg-salah-soft" : "border-line hover:border-ink"
                } disabled:cursor-default`}
              >
                <span className="bubble" data-state={state}>{LETTERS[i]}</span>
                <span className="font-semibold">{opt}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite">
        {answered && (
          <div className="mt-5 border-t border-line pt-4">
            <p className={`font-semibold ${chosen === Q.correct ? "text-benar" : "text-salah"}`}>
              {chosen === Q.correct ? "Benar, +10 poin." : `Belum tepat. Jawabannya ${LETTERS[Q.correct]}.`}
            </p>
            <p className="mt-1 text-[15px] text-graphite">{Q.explanation}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-graphite">Ditulis oleh Rani, dinilai berguna oleh 14 teman sekelas</span>
              <button type="button" onClick={() => setChosen(null)} className="font-semibold text-ink underline underline-offset-4">
                Coba lagi
              </button>
            </div>
          </div>
        )}
        {!answered && <p className="mt-5 text-sm text-graphite">Pilih satu lingkaran jawaban.</p>}
      </div>
    </div>
  );
}
