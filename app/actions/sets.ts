"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, questionSets } from "@/db";
import { requireMember } from "@/lib/auth";
import { setSchema, firstError, type FormState } from "@/lib/validation";

async function loadSet(setId: string) {
  const set = await db.query.questionSets.findFirst({ where: eq(questionSets.id, setId) });
  if (!set) throw new Error("Bank soal tidak ditemukan");
  const ctx = await requireMember(set.classroomId);
  return { set, ...ctx, canManage: ctx.isOwner || set.createdById === ctx.user.id };
}

export async function createSet(classroomId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireMember(classroomId);
  const parsed = setSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const [set] = await db.insert(questionSets)
    .values({ ...parsed.data, classroomId, createdById: user.id }).returning({ id: questionSets.id });
  redirect(`/kelas/${classroomId}/bank/${set.id}`);
}

export async function updateSet(setId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { set, canManage } = await loadSet(setId);
  if (!canManage) return { error: "Hanya pembuat bank soal atau pemilik kelas yang bisa mengubahnya." };
  const parsed = setSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await db.update(questionSets).set(parsed.data).where(eq(questionSets.id, setId));
  revalidatePath(`/kelas/${set.classroomId}/bank/${setId}`);
  return { ok: true, message: "Bank soal diperbarui." };
}

export async function deleteSet(setId: string) {
  const { set, canManage } = await loadSet(setId);
  if (!canManage) return;
  await db.delete(questionSets).where(eq(questionSets.id, setId));
  redirect(`/kelas/${set.classroomId}`);
}
