import { eq } from "drizzle-orm";
import { db, classrooms } from "@/db";
import { requireMember } from "@/lib/auth";
import { ConfirmButton, StatefulForm, SubmitButton } from "@/components/forms";
import { deleteClassroom, leaveClassroom, regenerateCode, updateClassroom } from "@/app/actions/classroom";

export default async function Settings({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isOwner } = await requireMember(id);
  const c = (await db.query.classrooms.findFirst({ where: eq(classrooms.id, id) }))!;

  if (!isOwner) {
    return (
      <div className="max-w-xl">
        <h2 className="text-2xl font-bold">Pengaturan</h2>
        <div className="panel mt-6 p-5">
          <h3 className="font-bold">Keluar dari kelas</h3>
          <p className="mt-1 text-sm text-graphite">Soal yang sudah kamu tulis tetap tersimpan untuk anggota lain.</p>
          <div className="mt-4">
            <ConfirmButton action={leaveClassroom.bind(null, id)} message={`Keluar dari ${c.name}?`}>Keluar dari kelas</ConfirmButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-2xl font-bold">Pengaturan kelas</h2>
      <section className="panel p-5">
        <StatefulForm action={updateClassroom.bind(null, id)} className="space-y-3">
          <div>
            <label htmlFor="name" className="label">Nama kelas</label>
            <input id="name" name="name" defaultValue={c.name} className="field" />
          </div>
          <div>
            <label htmlFor="description" className="label">Deskripsi</label>
            <textarea id="description" name="description" rows={3} defaultValue={c.description ?? ""} className="field" />
          </div>
          <SubmitButton>Simpan perubahan</SubmitButton>
        </StatefulForm>
      </section>
      <section className="panel p-5">
        <h3 className="font-bold">Kode undangan</h3>
        <p className="mt-1 text-sm text-graphite">Buat kode baru jika kode lama tersebar ke orang yang tidak seharusnya. Kode lama langsung tidak berlaku.</p>
        <div className="mt-4">
          <ConfirmButton action={regenerateCode.bind(null, id)} message="Buat kode undangan baru?" className="btn-ghost btn-sm">Buat kode baru</ConfirmButton>
        </div>
      </section>
      <section className="panel border-salah/30 p-5">
        <h3 className="font-bold text-salah">Hapus kelas</h3>
        <p className="mt-1 text-sm text-graphite">Semua bank soal, soal, dan riwayat kuis di kelas ini ikut terhapus permanen.</p>
        <div className="mt-4">
          <ConfirmButton action={deleteClassroom.bind(null, id)} message={`Hapus kelas ${c.name} secara permanen?`}>Hapus kelas</ConfirmButton>
        </div>
      </section>
    </div>
  );
}
