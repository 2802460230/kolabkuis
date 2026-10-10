import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { StatefulForm, SubmitButton } from "@/components/forms";
import { login } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Masuk" };

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ lanjut?: string }> }) {
  const { lanjut } = await searchParams;
  return (
    <AuthShell title="Masuk" subtitle="Lanjutkan latihan dan menulis soal bersama kelasmu.">
      <StatefulForm action={login} className="space-y-4">
        <input type="hidden" name="lanjut" value={lanjut ?? ""} />
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="field" />
        </div>
        <div>
          <label htmlFor="password" className="label">Kata sandi</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
        </div>
        <SubmitButton className="btn-primary w-full" pendingText="Memeriksa…">Masuk</SubmitButton>
      </StatefulForm>
      <p className="mt-6 text-sm text-graphite">
        Belum punya akun? <Link href="/daftar" className="font-semibold text-ink underline underline-offset-4">Daftar</Link>
      </p>
    </AuthShell>
  );
}
