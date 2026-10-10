// Helper autentikasi & otorisasi untuk Server Component dan Server Action
import "server-only";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { db, users, memberships } from "@/db";
import { SESSION_COOKIE, signSession, verifySession, cookieOptions } from "./session";

export async function startSession(userId: string) {
  const token = await signSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions);
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

// Pengguna yang sedang login (atau null). Di-cache per request.
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = await verifySession(token);
  if (!userId) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, name: true, email: true, university: true },
  });
  return user ?? null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  return user;
}

// Memastikan pengguna adalah anggota kelas; jika bukan, halaman 404
// (tidak membocorkan keberadaan kelas ke orang luar).
export async function requireMember(classroomId: string) {
  const user = await requireUser();
  const membership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, user.id), eq(memberships.classroomId, classroomId)),
  });
  if (!membership) notFound();
  return { user, membership, isOwner: membership.role === "OWNER" };
}
