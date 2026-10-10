"use client";
import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const PendingContext = createContext<boolean | null>(null);

// Form dengan pesan error/sukses dari Server Action.
// Submit ditangani manual agar isian tidak terhapus saat validasi gagal
// (React 19 otomatis me-reset form yang memakai prop action).
export function StatefulForm({
  action, children, className, resetOnSuccess = false, onReset,
}: { action: Action; children: ReactNode; className?: string; resetOnSuccess?: boolean; onReset?: () => void }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(data));
  }

  return (
    <PendingContext.Provider value={pending}>
      <form ref={ref} onSubmit={onSubmit} className={className} onReset={onReset} noValidate>
        {children}
        <FormMessage state={state} />
      </form>
    </PendingContext.Provider>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state?.error && !state?.message) return null;
  return (
    <p role={state.error ? "alert" : "status"}
      className={`mt-3 rounded-lg px-3 py-2 text-sm ${state.error ? "bg-salah-soft text-salah" : "bg-benar-soft text-benar"}`}>
      {state.error ?? state.message}
    </p>
  );
}

export function SubmitButton({
  children, pendingText = "Menyimpan…", className = "btn-primary", name, value,
}: { children: ReactNode; pendingText?: string; className?: string; name?: string; value?: string }) {
  const ctx = useContext(PendingContext);
  const status = useFormStatus();
  const pending = ctx ?? status.pending;
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending} name={name} value={value}>
      {pending ? pendingText : children}
    </button>
  );
}

// Tombol aksi berbahaya (hapus/keluar) dengan konfirmasi
export function ConfirmButton({
  action, message, children, className = "btn-danger btn-sm",
}: { action: () => Promise<void>; message: string; children: ReactNode; className?: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      <SubmitButton className={className} pendingText="Memproses…">{children}</SubmitButton>
    </form>
  );
}
