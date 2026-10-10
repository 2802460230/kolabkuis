"use server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, users } from "@/db";
import { startSession, endSession } from "@/lib/auth";
import { registerSchema, loginSchema, firstError, type FormState } from "@/lib/validation";

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  // Hanya izinkan redirect ke path internal (cegah open redirect)
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { name, email, university, password } = parsed.data;

  const exists = await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true } });
  if (exists) return { error: "Email sudah terdaftar. Silakan masuk." };

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({ name, email, university, passwordHash }).returning({ id: users.id });
  await startSession(user.id);
  redirect(safeNext(formData.get("lanjut")));
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  // Pesan sama untuk email/sandi salah agar tidak membocorkan email terdaftar
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { error: "Email atau kata sandi salah." };
  }
  await startSession(user.id);
  redirect(safeNext(formData.get("lanjut")));
}

export async function logout() {
  await endSession();
  redirect("/");
}
