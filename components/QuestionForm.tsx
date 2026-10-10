"use client";
import { useState } from "react";
import Link from "next/link";
import { StatefulForm, SubmitButton } from "./forms";
import type { FormState } from "@/lib/validation";
import { LETTERS } from "@/lib/format";

type Initial = { prompt: string; options: string[]; correctIndex: number; explanation: string; difficulty: string };

export function QuestionForm({
  action, initial, cancelHref, mode,
}: { action: (s: FormState, f: FormData) => Promise<FormState>; initial?: Initial; cancelHref: string; mode: "create" | "edit" }) {
  const [correct, setCorrect] = useState<number | null>(initial?.correctIndex ?? null);

  return (
    <StatefulForm action={action} className="space-y-6" resetOnSuccess onReset={() => setCorrect(null)}>
      <div>
        <label htmlFor="prompt" className="label">Pertanyaan</label>
        <textarea id="prompt" name="prompt" rows={4} defaultValue={initial?.prompt} className="field"
          placeholder="Tulis pertanyaan dengan jelas dan lengkap." />
      </div>

      <fieldset>
        <legend className="label">Pilihan jawaban</legend>
        <p className="mb-3 text-sm text-graphite">Klik lingkaran huruf untuk menandai kunci jawaban.</p>
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input type="radio" name="correctIndex" value={i} className="peer sr-only"
                  checked={correct === i} onChange={() => setCorrect(i)} aria-label={`Jadikan ${LETTERS[i]} kunci jawaban`} />
                <span className="bubble peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ljk"
                  data-state={correct === i ? "correct" : undefined}>{LETTERS[i]}</span>
              </label>
              <label htmlFor={`option${i}`} className="sr-only">Pilihan {LETTERS[i]}</label>
              <input id={`option${i}`} name={`option${i}`} defaultValue={initial?.options[i]} className="field"
                placeholder={`Pilihan ${LETTERS[i]}`} />
            </div>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="explanation" className="label">Pembahasan</label>
        <textarea id="explanation" name="explanation" rows={4} defaultValue={initial?.explanation} className="field"
          placeholder="Jelaskan kenapa jawaban itu benar. Pembahasan ini muncul setelah teman menjawab." />
      </div>

      <fieldset>
        <legend className="label">Tingkat kesulitan</legend>
        <div className="flex flex-wrap gap-2">
          {[["MUDAH", "Mudah"], ["SEDANG", "Sedang"], ["SULIT", "Sulit"]].map(([v, l]) => (
            <label key={v} className="cursor-pointer">
              <input type="radio" name="difficulty" value={v} defaultChecked={(initial?.difficulty ?? "SEDANG") === v} className="peer sr-only" />
              <span className="inline-block rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-ljk">
                {l}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        <SubmitButton>{mode === "create" ? "Simpan soal" : "Simpan perubahan"}</SubmitButton>
        {mode === "create" && (
          <SubmitButton className="btn-ghost" name="lagi" value="1">Simpan dan tulis lagi</SubmitButton>
        )}
        <Link href={cancelHref} className="btn text-graphite hover:text-ink">Batal</Link>
      </div>
    </StatefulForm>
  );
}
