// Skema validasi input (dijalankan di server, tidak bisa dilewati dari browser)
import { z } from "zod";

const trimmed = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label} minimal ${min} karakter`).max(max, `${label} maksimal ${max} karakter`);

export const registerSchema = z.object({
  name: trimmed(2, 60, "Nama"),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  university: z.string().trim().max(80, "Nama kampus maksimal 80 karakter").optional().transform((v) => v || null),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72, "Kata sandi maksimal 72 karakter"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export const classroomSchema = z.object({
  name: trimmed(3, 80, "Nama kelas"),
  description: z.string().trim().max(300, "Deskripsi maksimal 300 karakter").optional().transform((v) => v || null),
});

export const joinSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6}$/, "Kode kelas terdiri dari 6 huruf/angka"),
});

export const setSchema = z.object({
  title: trimmed(3, 100, "Judul bank soal"),
  description: z.string().trim().max(300, "Deskripsi maksimal 300 karakter").optional().transform((v) => v || null),
});

export const questionSchema = z.object({
  prompt: trimmed(10, 1000, "Pertanyaan"),
  options: z.array(trimmed(1, 300, "Pilihan jawaban")).length(4, "Isi keempat pilihan jawaban")
    .refine((opts) => new Set(opts.map((o) => o.toLowerCase())).size === 4, "Pilihan jawaban tidak boleh sama"),
  correctIndex: z.coerce.number({ invalid_type_error: "Pilih kunci jawaban" }).int().min(0, "Pilih kunci jawaban").max(3, "Pilih kunci jawaban"),
  explanation: trimmed(10, 1500, "Pembahasan"),
  difficulty: z.enum(["MUDAH", "SEDANG", "SULIT"]),
});

export const reportSchema = z.object({
  reason: trimmed(5, 300, "Alasan laporan"),
});

export type FormState = { error?: string; ok?: boolean; message?: string } | undefined;

export function firstError(err: z.ZodError) {
  return err.issues[0]?.message ?? "Input tidak valid";
}
