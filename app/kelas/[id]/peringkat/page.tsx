import { requireMember } from "@/lib/auth";
import { getLeaderboard, POINTS } from "@/lib/queries";

export default async function Leaderboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireMember(id);
  const rows = await getLeaderboard(id);

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold">Papan peringkat</h2>
      <p className="mt-1 text-graphite">
        {POINTS.correctAnswer} poin per jawaban benar, {POINTS.questionWritten} poin per soal yang ditulis,
        dan {POINTS.upvoteReceived} poin untuk setiap suara naik dari teman.
      </p>
      <ol className="panel mt-6 divide-y divide-line">
        {rows.map((r, i) => {
          const me = r.user_id === user.id;
          return (
            <li key={r.user_id} className={`flex items-center gap-4 px-4 py-3.5 sm:px-5 ${me ? "bg-marker/25" : ""}`}>
              <span className="bubble" data-state={i < 3 && r.points > 0 ? "filled" : undefined}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.name}{me && <span className="font-normal text-graphite"> (kamu)</span>}</p>
                <p className="text-sm text-graphite">{r.correct} benar, {r.written} soal ditulis, {r.upvotes} suara naik</p>
              </div>
              <span className="font-display text-2xl font-bold">{r.points}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
