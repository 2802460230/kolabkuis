import { randomBytes } from "crypto";

// ID acak 20 karakter, aman dipakai di URL
export function createId(): string {
  return randomBytes(15).toString("base64url");
}

// Kode undangan kelas: 6 karakter tanpa huruf yang mudah tertukar (O/0, I/1)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function createClassCode(): string {
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
