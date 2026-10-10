"use client";
import { useState } from "react";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
      }}
      className="group inline-flex items-center gap-3 rounded-lg border border-dashed border-ljk bg-ljk-soft/60 px-3 py-1.5"
      aria-label={`Salin kode kelas ${code}`}
    >
      <span className="font-display text-lg font-bold tracking-[0.2em] text-ink">{code}</span>
      <span className="text-xs font-semibold text-ljk">{copied ? "Tersalin" : "Salin"}</span>
    </button>
  );
}
