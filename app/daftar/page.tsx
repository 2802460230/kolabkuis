import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { StatefulForm, SubmitButton } from "@/components/forms";
import { register } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Daftar" };

export default async function DaftarPage({ searchParams }: { searchParams: Promise<{ lanjut?: string }> }) {
  const { lanjut } = await searchParams;
  return (
    <AuthShell title="Buat akun" subtitle="Gratis untuk mahasiswa dan dosen. Hanya butuh satu menit.">
      <StatefulForm action={register} className="space-y-4">
        <input type="hidden" name="lanjut" value={lanjut ?? ""} />
        <div>
          <label htmlFor="name" className="label">Nama lengkap</label>
          <input id="name" name="name" autoComplete="name" required className="field" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="field" />
        </div>
        <div>
          <label htmlFor="university" className="label">Kampus <span className="font-normal text-graphite">(opsional)</span></label>
          <input id="university" name="university" autoComplete="organization" className="field" />
        </div>
        <div>
          <label htmlFor="password" className="label">Kata sandi</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="field" aria-describedby="pw-hint" />
          <p id="pw-hint" className="mt-1 text-sm text-graphite">Minimal 8 karakter.</p>
        </div>
        <SubmitButton className="btn-primary w-full" pendingText="Membuat akun…">Buat akun</SubmitButton>
      </StatefulForm>
      <p className="mt-6 text-sm text-graphite">
        Sudah punya akun? <Link href="/masuk" className="font-semibold text-ink underline underline-offset-4">Masuk</Link>
      </p>
    </AuthShell>
  );
}
