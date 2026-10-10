import { Nav } from "./Nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">{children}</main>
    </>
  );
}
