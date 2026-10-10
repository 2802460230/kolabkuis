const dtf = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
export const formatDate = (d: Date | string) => dtf.format(new Date(d));
export const DIFFICULTY_LABEL: Record<string, string> = { MUDAH: "Mudah", SEDANG: "Sedang", SULIT: "Sulit" };
export const LETTERS = ["A", "B", "C", "D"];
