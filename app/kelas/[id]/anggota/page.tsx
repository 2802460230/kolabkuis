import { asc, eq } from "drizzle-orm";
import { db, memberships, users } from "@/db";
import { requireMember } from "@/lib/auth";
import { ConfirmButton } from "@/components/forms";
import { removeMember } from "@/app/actions/classroom";
import { formatDate } from "@/lib/format";

export default async function Members({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, isOwner } = await requireMember(id);
  const rows = await db
    .select({ id: users.id, name: users.name, university: users.university, role: memberships.role, joinedAt: memberships.joinedAt })
    .from(memberships).innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.classroomId, id)).orderBy(asc(memberships.joinedAt));

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold">Anggota ({rows.length})</h2>
      <p className="mt-1 text-graphite">Ajak teman dengan membagikan kode undangan di atas.</p>
      <ul className="panel mt-6 divide-y divide-line">
        {rows.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
              <p className="font-semibold">
                {m.name}{m.id === user.id && <span className="font-normal text-graphite"> (kamu)</span>}
                {m.role === "OWNER" && <span className="ml-2 rounded-full bg-ljk-soft px-2 py-0.5 text-xs font-semibold text-ljk">Pemilik</span>}
              </p>
              <p className="text-sm text-graphite">{m.university ? `${m.university}, ` : ""}bergabung {formatDate(m.joinedAt)}</p>
            </div>
            {isOwner && m.role !== "OWNER" && (
              <ConfirmButton action={removeMember.bind(null, id, m.id)} message={`Keluarkan ${m.name} dari kelas?`}>Keluarkan</ConfirmButton>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
