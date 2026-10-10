import { Logo } from "./Logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-8"><Logo /></div>
      <div className="panel w-full max-w-md p-6 sm:p-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-graphite">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
