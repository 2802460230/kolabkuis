// Data contoh untuk demo & penjurian. Jalankan: npm run db:seed
// PERINGATAN: menghapus seluruh data yang ada.
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db, users, classrooms, memberships, questionSets, questions, votes, reports, attempts, attemptAnswers } from "./index";

type Seedq = { p: string; o: [string, string, string, string]; c: number; e: string; d?: "MUDAH" | "SEDANG" | "SULIT"; by: string };

const STACK_QUEUE: Seedq[] = [
  { by: "rani", d: "MUDAH", p: "Struktur data apa yang bekerja dengan prinsip LIFO (Last In, First Out)?", o: ["Queue", "Stack", "Linked list", "Binary heap"], c: 1, e: "Stack menambah dan mengambil elemen dari ujung yang sama (top), sehingga elemen terakhir yang masuk adalah yang pertama keluar. Queue bersifat FIFO." },
  { by: "bima", d: "MUDAH", p: "Operasi untuk mengambil elemen teratas dari stack disebut…", o: ["push", "pop", "enqueue", "peek"], c: 1, e: "pop menghapus dan mengembalikan elemen teratas. peek hanya melihat tanpa menghapus, push menambah elemen." },
  { by: "rani", d: "SEDANG", p: "Kompleksitas waktu operasi enqueue dan dequeue pada queue berbasis circular array adalah…", o: ["O(1) dan O(1)", "O(1) dan O(n)", "O(n) dan O(1)", "O(log n) dan O(log n)"], c: 0, e: "Circular array memakai indeks front dan rear yang bergerak memutar (modulo kapasitas), sehingga tidak perlu menggeser elemen. Keduanya O(1)." },
  { by: "sekar", d: "SEDANG", p: "Ekspresi infix (A + B) * C jika diubah ke notasi postfix menjadi…", o: ["A B C + *", "A B + C *", "+ A B * C", "A + B C *"], c: 1, e: "Kurung dievaluasi dulu: A + B menjadi A B +. Hasilnya dikalikan C, jadi A B + C *. Konversi ini biasa dilakukan dengan stack operator (algoritma Shunting-yard)." },
  { by: "darrus", d: "SEDANG", p: "Fitur 'Undo' pada editor teks paling tepat diimplementasikan dengan…", o: ["Queue", "Stack", "Hash table", "Graph"], c: 1, e: "Aksi terakhir harus dibatalkan pertama kali (LIFO). Setiap aksi di-push ke stack, dan Undo melakukan pop." },
  { by: "bima", d: "SULIT", p: "Berapa jumlah stack minimal yang dibutuhkan untuk mensimulasikan sebuah queue dengan biaya amortized O(1) per operasi?", o: ["1", "2", "3", "Tidak mungkin"], c: 1, e: "Gunakan stack masuk dan stack keluar. Saat dequeue dan stack keluar kosong, pindahkan seluruh isi stack masuk. Setiap elemen dipindah paling banyak sekali, jadi amortized O(1)." },
  { by: "sekar", d: "MUDAH", p: "Antrean pencetakan dokumen di printer kantor adalah contoh penerapan…", o: ["Stack", "Queue", "Tree", "Set"], c: 1, e: "Dokumen yang dikirim lebih dulu dicetak lebih dulu, sesuai prinsip FIFO pada queue." },
  { by: "dimas", d: "SEDANG", p: "Kondisi stack overflow terjadi ketika…", o: ["pop dilakukan pada stack kosong", "push dilakukan pada stack yang sudah penuh", "stack berisi elemen duplikat", "top bernilai -1"], c: 0, e: "(Soal ini sengaja dibuat keliru untuk demo fitur laporan.)" },
];

const TREE: Seedq[] = [
  { by: "rani", d: "MUDAH", p: "Pada Binary Search Tree, semua nilai di subtree kiri sebuah node selalu…", o: ["Lebih besar dari node tersebut", "Lebih kecil dari node tersebut", "Sama dengan node tersebut", "Acak"], c: 1, e: "Sifat BST: subtree kiri < node < subtree kanan. Sifat inilah yang membuat pencarian bisa membuang separuh pohon di setiap langkah." },
  { by: "darrus", d: "SEDANG", p: "Traversal yang menghasilkan urutan terurut menaik pada BST adalah…", o: ["Pre-order", "In-order", "Post-order", "Level-order"], c: 1, e: "In-order mengunjungi kiri, node, lalu kanan. Karena kiri < node < kanan, hasilnya terurut menaik." },
  { by: "sekar", d: "SULIT", p: "Kompleksitas pencarian terburuk pada BST yang tidak seimbang dengan n node adalah…", o: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], c: 2, e: "Jika data dimasukkan dalam keadaan terurut, BST berubah menjadi seperti linked list dengan tinggi n. Karena itu dibutuhkan pohon seimbang seperti AVL atau Red-Black Tree." },
  { by: "bima", d: "SEDANG", p: "Tinggi minimum sebuah binary tree dengan 15 node adalah… (tinggi pohon satu node = 0)", o: ["2", "3", "4", "14"], c: 1, e: "Pohon biner sempurna dengan tinggi h memuat 2^(h+1) - 1 node. Untuk h = 3 didapat 15 node, jadi tinggi minimumnya 3." },
];

const OSI: Seedq[] = [
  { by: "darrus", d: "MUDAH", p: "Protokol HTTP bekerja pada lapisan OSI ke berapa?", o: ["Layer 3 (Network)", "Layer 4 (Transport)", "Layer 7 (Application)", "Layer 2 (Data Link)"], c: 2, e: "HTTP adalah protokol aplikasi, berjalan di atas TCP (Layer 4) pada Layer 7." },
  { by: "rani", d: "SEDANG", p: "Perangkat yang meneruskan frame berdasarkan alamat MAC adalah…", o: ["Router", "Switch", "Hub", "Repeater"], c: 1, e: "Switch bekerja di Layer 2 dan menyimpan tabel MAC address untuk meneruskan frame ke port tujuan. Router bekerja di Layer 3 dengan alamat IP." },
  { by: "darrus", d: "SEDANG", p: "Berapa jumlah host yang dapat dipakai pada subnet /26?", o: ["62", "64", "30", "126"], c: 0, e: "/26 menyisakan 6 bit host: 2^6 = 64 alamat, dikurangi alamat network dan broadcast, jadi 62 host." },
];

async function main() {
  console.log("Mengosongkan tabel…");
  await db.execute(sql`truncate table attempt_answers, attempts, reports, votes, questions, question_sets, memberships, classrooms, users cascade`);

  const hash = await bcrypt.hash("demo12345", 10);
  const people = [
    { key: "darrus", name: "Darrus Loamayer", email: "demo@kolabkuis.id", university: "BINUS University" },
    { key: "rani", name: "Rani Pratiwi", email: "rani@kolabkuis.id", university: "BINUS University" },
    { key: "bima", name: "Bima Saputra", email: "bima@kolabkuis.id", university: "BINUS University" },
    { key: "sekar", name: "Sekar Ayu", email: "sekar@kolabkuis.id", university: "BINUS University" },
    { key: "dimas", name: "Dimas Nugroho", email: "dimas@kolabkuis.id", university: "BINUS University" },
  ];
  const u: Record<string, string> = {};
  for (const p of people) {
    const [row] = await db.insert(users).values({ name: p.name, email: p.email, university: p.university, passwordHash: hash }).returning();
    u[p.key] = row.id;
  }

  const [sd] = await db.insert(classrooms).values({
    name: "Struktur Data, Kelas IF-A", description: "Latihan bersama menjelang UTS. Satu bank soal per bab.", code: "SDIF2A", ownerId: u.darrus,
  }).returning();
  const [jk] = await db.insert(classrooms).values({
    name: "Jaringan Komputer", description: "Bank soal CCNA dasar dan materi kuliah.", code: "JARKOM", ownerId: u.darrus,
  }).returning();
  await db.insert(memberships).values([
    { userId: u.darrus, classroomId: sd.id, role: "OWNER" },
    ...["rani", "bima", "sekar", "dimas"].map((k) => ({ userId: u[k], classroomId: sd.id })),
    { userId: u.darrus, classroomId: jk.id, role: "OWNER" },
    { userId: u.rani, classroomId: jk.id },
  ]);

  async function addSet(classroomId: string, title: string, description: string, by: string, qs: Seedq[]) {
    const [set] = await db.insert(questionSets).values({ classroomId, title, description, createdById: u[by] }).returning();
    const rows = await db.insert(questions).values(qs.map((q) => ({
      setId: set.id, authorId: u[q.by], prompt: q.p, options: q.o, correctIndex: q.c, explanation: q.e, difficulty: q.d ?? "SEDANG",
    }))).returning();
    return { set, rows };
  }

  const s1 = await addSet(sd.id, "Bab 3: Stack dan Queue", "Konsep LIFO/FIFO, implementasi array dan linked list, notasi postfix.", "rani", STACK_QUEUE);
  const s2 = await addSet(sd.id, "Bab 5: Tree dan Binary Search Tree", "Traversal, sifat BST, tinggi pohon.", "darrus", TREE);
  await addSet(jk.id, "Model OSI dan subnetting", "Tujuh lapisan OSI, perangkat jaringan, perhitungan subnet.", "darrus", OSI);

  // Suara: orang tidak memberi suara pada soalnya sendiri
  const voters = ["darrus", "rani", "bima", "sekar", "dimas"];
  const voteRows: { userId: string; questionId: string; value: number }[] = [];
  [...s1.rows, ...s2.rows].forEach((q, qi) => {
    const isBad = q.prompt.startsWith("Kondisi stack overflow");
    voters.forEach((v, vi) => {
      if (u[v] === q.authorId) return;
      if (isBad) { voteRows.push({ userId: u[v], questionId: q.id, value: -1 }); return; }
      // Variasi skor: jumlah suara naik berbeda per soal, sesekali suara turun
      const ups = [4, 3, 2, 4, 1, 3, 2, 4, 1, 3, 2][qi % 11];
      const others = voters.filter((x) => u[x] !== q.authorId);
      const pos = others.indexOf(v);
      if (pos < ups) voteRows.push({ userId: u[v], questionId: q.id, value: 1 });
      else if (pos === others.length - 1 && qi % 3 === 1) voteRows.push({ userId: u[v], questionId: q.id, value: -1 });
    });
  });
  await db.insert(votes).values(voteRows);

  const bad = s1.rows.find((q) => q.prompt.startsWith("Kondisi stack overflow"))!;
  await db.insert(reports).values([
    { questionId: bad.id, userId: u.rani, reason: "Kunci jawaban salah, seharusnya B (push pada stack penuh)." },
    { questionId: bad.id, userId: u.bima, reason: "Pilihan A itu underflow, bukan overflow." },
    { questionId: bad.id, userId: u.sekar, reason: "Pembahasan tidak menjelaskan apa-apa." },
  ]);

  // Riwayat kuis supaya papan peringkat terisi
  async function addAttempt(userKey: string, rows: typeof s1.rows, correctMask: boolean[], daysAgo: number) {
    const used = rows.filter((q) => q.id !== bad.id).slice(0, correctMask.length);
    const at = new Date(Date.now() - daysAgo * 86400000);
    const [a] = await db.insert(attempts).values({
      userId: u[userKey], setId: used[0].setId, questionIds: used.map((q) => q.id),
      score: correctMask.filter(Boolean).length, finishedAt: at, createdAt: at,
    }).returning();
    await db.insert(attemptAnswers).values(used.map((q, i) => ({
      attemptId: a.id, questionId: q.id, correct: correctMask[i],
      chosenIndex: correctMask[i] ? q.correctIndex : (q.correctIndex + 1) % 4,
    })));
  }
  const T = true, F = false;
  await addAttempt("bima", s1.rows, [T, T, T, T, T, T, T], 3);
  await addAttempt("sekar", s1.rows, [T, T, F, T, T, F, T], 2);
  await addAttempt("rani", s2.rows, [T, T, T, F], 2);
  await addAttempt("dimas", s1.rows, [T, F, F, T, F, T, F], 1);
  await addAttempt("darrus", s1.rows, [T, T, T, T, F, T, T], 1);
  await addAttempt("bima", s2.rows, [T, T, F, T], 0);

  console.log("Selesai. Login demo: demo@kolabkuis.id / demo12345 (kode kelas SDIF2A dan JARKOM)");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
