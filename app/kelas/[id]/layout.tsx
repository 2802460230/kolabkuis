import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, classrooms } from "@/db";
import { AppShell } from "@/components/AppShell";
import { ClassTabs } from "@/components/ClassTabs";
import { CopyCode } from "@/components/CopyCode";
import { requireMember } from "@/lib/auth";
import { getReportedQuestions } from "@/lib/queries";

export default async function ClassLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isOwner } = await requireMember(id);
  const classroom = await db.query.classrooms.findFirst({ where: eq(classrooms.id, id) });
  if (!classroom) notFound();
  const reportCount = isOwner ? (await getReportedQuestions(id)).length : 0;

  return (
    <AppShell>
      <header className="flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{classroom.name}</h1>
          {classroom.description && <p className="mt-2 max-w-prose text-graphite">{classroom.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-graphite">Kode undangan</span>
          <CopyCode code={classroom.code} />
        </div>
      </header>
      <ClassTabs base={`/kelas/${id}`} isOwner={isOwner} reportCount={reportCount} />
      <div className="pt-8">{children}</div>
    </AppShell>
  );
}
