# KolabKuis

Bank soal kolaboratif untuk kelas. Anggota kelas menulis soal pilihan ganda bersama, saling menilai kualitasnya lewat vote dan laporan, lalu berlatih melalui kuis interaktif dengan umpan balik langsung dan papan peringkat.

Dibuat oleh Tim Bai untuk Lomba Pemrograman Web Dinamis ICOM 2026 (subtema EduTech).

## Teknologi

- Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript
- PostgreSQL + Drizzle ORM
- Tailwind CSS
- Autentikasi: bcrypt (hash kata sandi) + JWT di cookie httpOnly (jose)
- Validasi input: Zod

## Menjalankan di komputer sendiri

Butuh Node.js 20+ dan database PostgreSQL (lokal atau Neon).

```bash
npm install
cp .env.example .env      # lalu isi DATABASE_URL dan JWT_SECRET
npm run db:push           # membuat tabel dari db/schema.ts
npm run db:seed           # data demo (MENGHAPUS data yang ada)
npm run dev               # http://localhost:3000
```

Akun demo setelah seed: `demo@kolabkuis.id` / `demo12345` (pemilik kelas). Akun lain: `rani@`, `bima@`, `sekar@`, `dimas@kolabkuis.id`, sandi sama. Kode kelas: `SDIF2A`, `JARKOM`.

## Deploy (Vercel + Neon, gratis)

1. **Database.** Buat akun di https://neon.tech, buat project baru (region Singapore). Salin *connection string* yang **pooled** (ada `-pooler` di host-nya).
2. **Isi database dari komputer sendiri.** Masukkan string tadi ke `.env` sebagai `DATABASE_URL`, lalu jalankan `npm run db:push` dan `npm run db:seed`.
3. **Kode ke GitHub.** Buat repo baru, lalu:
   ```bash
   git init && git add . && git commit -m "KolabKuis"
   git branch -M main
   git remote add origin https://github.com/<username>/kolabkuis.git
   git push -u origin main
   ```
4. **Vercel.** Login https://vercel.com dengan GitHub, *Add New Project*, pilih repo `kolabkuis`. Di *Environment Variables* isi:
   - `DATABASE_URL` = connection string Neon
   - `JWT_SECRET` = string acak minimal 32 karakter (buat dengan `openssl rand -base64 48`)

   Klik *Deploy*. Setelah selesai, link `https://kolabkuis-xxx.vercel.app` itulah link prototype.

## Pengujian end-to-end

`tests/e2e.py` menjalankan 38 skenario dengan Playwright di desktop dan ponsel (390 px): registrasi, gabung kelas, vote, laporan, tulis/ubah/hapus soal, kuis sampai hasil, hak akses pemilik dan anggota, kerahasiaan kunci jawaban, dan papan peringkat.

Jalankan hanya terhadap database lokal, karena tes menambah dan menghapus data:

```bash
npm run db:push && npm run db:seed
npm run build && npm start            # terminal 1
pip install playwright && python -m playwright install chromium
python tests/e2e.py                   # terminal 2
```

## Struktur proyek

```
app/                 halaman (App Router)
  actions/           Server Actions: auth, classroom, sets, questions, quiz
  kelas/[id]/        halaman kelas: bank soal, peringkat, anggota, laporan, pengaturan
  kuis/[setId]/      mode kuis
  hasil/[attemptId]/ hasil dan pembahasan
components/          komponen UI (QuizPlayer, QuestionCard, QuestionForm, …)
db/schema.ts         skema basis data (9 tabel)
db/seed.ts           data demo
lib/auth.ts          sesi, requireUser, requireMember (otorisasi)
lib/queries.ts       query baca, aturan moderasi, poin peringkat
lib/validation.ts    skema validasi Zod
middleware.ts        proteksi rute yang butuh login
```

## Aturan penting

- Soal disembunyikan otomatis dari kuis bila skor vote ≤ −3 atau ada ≥ 3 laporan terbuka.
- Poin peringkat: 10 per jawaban benar, 5 per soal aktif yang ditulis (soal yang disembunyikan tidak dihitung), 2 per suara naik dari anggota lain.
- Kunci jawaban tidak pernah dikirim ke browser selama kuis; setiap jawaban diperiksa di server dan satu soal hanya bisa dijawab sekali per sesi.
- Di halaman bank soal, kunci dan pembahasan hanya dirender untuk penulis soal, pemilik kelas, atau anggota yang sudah mengerjakan soal itu di kuis.
- Penulis tidak bisa memberi vote pada soalnya sendiri (dicek di server).
- Halaman kelas hanya bisa dibuka anggotanya (selain anggota mendapat 404).
