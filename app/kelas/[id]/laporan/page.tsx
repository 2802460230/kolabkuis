import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { getReportedQuestions, HIDE_REPORTS } from "@/lib/queries";
import { ConfirmButton } from "@/components/forms";
import { deleteQuestion, resolveReports } from "@/app/actions/questions";

export default async function Reports({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isOwner } = await requireMember(id);
  if (!isOwner) notFound();
  const rows = await getReportedQuestions(id);

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold">Laporan soal</h2>
      <p className="mt-1 text-graphite">
        Soal dengan {HIDE_REPORTS} laporan atau lebih sudah otomatis disembunyikan dari kuis. Tandai selesai jika soal ternyata benar, atau hapus jika memang keliru.
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-graphite">Tidak ada laporan terbuka. Semua soal di kelas ini aman.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li key={r.questionId} className="panel p-5">
              <p className="text-sm text-graphite">
                <Link href={`/kelas/${id}/bank/${r.setId}`} className="font-semibold underline underline-offset-4">{r.setTitle}</Link>, ditulis {r.authorName}
              </p>
              <p className="mt-2 line-clamp-3 font-semibold">{r.prompt}</p>
              <p className="mt-3 text-sm font-semibold text-salah">{r.openReports} laporan</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-graphite">
                {(r.reasons ?? []).map((reason, i) => <li key={i}>{reason}</li>)}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <ConfirmButton action={resolveReports.bind(null, r.questionId)} message="Tandai laporan selesai? Soal akan kembali muncul di kuis." className="btn-ghost btn-sm">
                  Soal sudah benar
                </ConfirmButton>
                <ConfirmButton action={deleteQuestion.bind(null, r.questionId)} message="Hapus soal ini?">Hapus soal</ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
