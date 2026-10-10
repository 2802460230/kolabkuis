"use server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, classrooms, memberships } from "@/db";
import { requireUser, requireMember } from "@/lib/auth";
import { createClassCode } from "@/lib/id";
import { classroomSchema, joinSchema, firstError, type FormState } from "@/lib/validation";

export async function createClassroom(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = classroomSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  // Transaksi: kelas dan keanggotaan pemilik dibuat bersamaan
  const classroom = await db.transaction(async (tx) => {
    for (let i = 0; i < 5; i++) {
      const code = createClassCode();
      const taken = await tx.query.classrooms.findFirst({ where: eq(classrooms.code, code), columns: { id: true } });
      if (taken) continue;
      const [c] = await tx.insert(classrooms).values({ ...parsed.data, code, ownerId: user.id }).returning();
      await tx.insert(memberships).values({ userId: user.id, classroomId: c.id, role: "OWNER" });
      return c;
    }
    throw new Error("Gagal membuat kode kelas unik");
  });
  redirect(`/kelas/${classroom.id}`);
}

export async function joinClassroom(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = joinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const classroom = await db.query.classrooms.findFirst({ where: eq(classrooms.code, parsed.data.code) });
  if (!classroom) return { error: "Kelas dengan kode itu tidak ditemukan. Periksa lagi kodenya." };

  await db.insert(memberships).values({ userId: user.id, classroomId: classroom.id }).onConflictDoNothing();
  redirect(`/kelas/${classroom.id}`);
}

export async function updateClassroom(classroomId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { isOwner } = await requireMember(classroomId);
  if (!isOwner) return { error: "Hanya pemilik kelas yang bisa mengubah kelas." };
  const parsed = classroomSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await db.update(classrooms).set(parsed.data).where(eq(classrooms.id, classroomId));
  revalidatePath(`/kelas/${classroomId}`);
  return { ok: true, message: "Perubahan kelas disimpan." };
}

export async function regenerateCode(classroomId: string) {
  const { isOwner } = await requireMember(classroomId);
  if (!isOwner) return;
  await db.update(classrooms).set({ code: createClassCode() }).where(eq(classrooms.id, classroomId));
  revalidatePath(`/kelas/${classroomId}`);
}

export async function deleteClassroom(classroomId: string) {
  const { isOwner } = await requireMember(classroomId);
  if (!isOwner) return;
  await db.delete(classrooms).where(eq(classrooms.id, classroomId)); // cascade ke bank soal, soal, dll.
  redirect("/dashboard");
}

export async function leaveClassroom(classroomId: string) {
  const { user, isOwner } = await requireMember(classroomId);
  if (isOwner) return; // pemilik tidak bisa keluar; hapus kelas sebagai gantinya
  await db.delete(memberships).where(and(eq(memberships.userId, user.id), eq(memberships.classroomId, classroomId)));
  redirect("/dashboard");
}

export async function removeMember(classroomId: string, memberId: string) {
  const { user, isOwner } = await requireMember(classroomId);
  if (!isOwner || memberId === user.id) return;
  await db.delete(memberships).where(and(eq(memberships.userId, memberId), eq(memberships.classroomId, classroomId)));
  revalidatePath(`/kelas/${classroomId}/anggota`);
}
