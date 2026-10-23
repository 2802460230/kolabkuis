// Query baca yang dipakai beberapa halaman
import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, questions, questionSets, votes, reports, users, attempts, memberships, classrooms } from "@/db";

// Aturan moderasi kolaboratif: soal disembunyikan dari kuis bila
// skor vote <= HIDE_SCORE atau laporan terbuka >= HIDE_REPORTS.
export const HIDE_SCORE = -3;
export const HIDE_REPORTS = 3;

// Poin papan peringkat
export const POINTS = { correctAnswer: 10, questionWritten: 5, upvoteReceived: 2 };

const scoreSql = sql<number>`coalesce((select sum(${votes.value}) from ${votes} where ${votes.questionId} = ${questions.id}), 0)::int`;
const openReportsSql = sql<number>`(select count(*) from ${reports} where ${reports.questionId} = ${questions.id} and ${reports.resolved} = false)::int`;

export function isHidden(q: { score: number; openReports: number }) {
  return q.score <= HIDE_SCORE || q.openReports >= HIDE_REPORTS;
}

// Semua soal di satu bank soal, beserta skor, vote milik user, dan jumlah laporan
export async function getQuestionsForSet(setId: string, userId: string) {
  const rows = await db
    .select({
      id: questions.id,
      prompt: questions.prompt,
      options: questions.options,
      correctIndex: questions.correctIndex,
      explanation: questions.explanation,
      difficulty: questions.difficulty,
      createdAt: questions.createdAt,
      authorId: questions.authorId,
      authorName: users.name,
      score: scoreSql,
      openReports: openReportsSql,
      myVote: sql<number | null>`(select ${votes.value} from ${votes} where ${votes.questionId} = ${questions.id} and ${votes.userId} = ${userId})`,
      myReport: sql<boolean>`exists(select 1 from ${reports} where ${reports.questionId} = ${questions.id} and ${reports.userId} = ${userId} and ${reports.resolved} = false)`,
      // Sudah pernah dijawab user ini di kuis? Kunci jawaban baru boleh dilihat setelah itu.
      answeredByMe: sql<boolean>`exists(select 1 from attempt_answers aa join attempts a on a.id = aa.attempt_id where aa.question_id = ${questions.id} and a.user_id = ${userId})`,
    })
    .from(questions)
    .innerJoin(users, eq(users.id, questions.authorId))
    .where(eq(questions.setId, setId))
    .orderBy(desc(scoreSql), desc(questions.createdAt));
  return rows.map((r) => ({ ...r, hidden: isHidden(r) }));
}

// Daftar bank soal di kelas + jumlah soal aktif
export async function getSetsForClass(classroomId: string) {
  return db
    .select({
      id: questionSets.id,
      title: questionSets.title,
      description: questionSets.description,
      createdAt: questionSets.createdAt,
      createdById: questionSets.createdById,
      creatorName: users.name,
      questionCount: sql<number>`(select count(*) from ${questions} where ${questions.setId} = ${questionSets.id})::int`,
      contributorCount: sql<number>`(select count(distinct ${questions.authorId}) from ${questions} where ${questions.setId} = ${questionSets.id})::int`,
    })
    .from(questionSets)
    .innerJoin(users, eq(users.id, questionSets.createdById))
    .where(eq(questionSets.classroomId, classroomId))
    .orderBy(desc(questionSets.createdAt));
}

export type LeaderRow = {
  user_id: string; name: string; correct: number; written: number; upvotes: number; points: number;
};

// Papan peringkat kelas: poin dari jawaban benar + kontribusi soal + upvote diterima
export async function getLeaderboard(classroomId: string): Promise<LeaderRow[]> {
  const res = await db.execute<LeaderRow>(sql`
    with member as (
      select m.user_id, u.name from ${memberships} m join ${users} u on u.id = m.user_id
      where m.classroom_id = ${classroomId}
    ),
    correct as (
      select a.user_id, count(*)::int as n
      from attempt_answers aa
      join attempts a on a.id = aa.attempt_id
      join question_sets s on s.id = a.set_id
      where s.classroom_id = ${classroomId} and aa.correct
      group by a.user_id
    ),
    written as (
      select q.author_id as user_id, count(*)::int as n
      from questions q join question_sets s on s.id = q.set_id
      where s.classroom_id = ${classroomId}
        -- hanya soal aktif: soal yang disembunyikan (dinilai buruk) tidak memberi poin
        and coalesce((select sum(v.value) from votes v where v.question_id = q.id), 0) > ${HIDE_SCORE}
        and (select count(*) from reports r where r.question_id = q.id and not r.resolved) < ${HIDE_REPORTS}
      group by q.author_id
    ),
    ups as (
      select q.author_id as user_id, count(*)::int as n
      from votes v join questions q on q.id = v.question_id
      join question_sets s on s.id = q.set_id
      where s.classroom_id = ${classroomId} and v.value = 1 and v.user_id <> q.author_id
      group by q.author_id
    )
    select member.user_id, member.name,
      coalesce(correct.n, 0) as correct,
      coalesce(written.n, 0) as written,
      coalesce(ups.n, 0) as upvotes,
      (coalesce(correct.n,0) * ${POINTS.correctAnswer}
        + coalesce(written.n,0) * ${POINTS.questionWritten}
        + coalesce(ups.n,0) * ${POINTS.upvoteReceived})::int as points
    from member
    left join correct on correct.user_id = member.user_id
    left join written on written.user_id = member.user_id
    left join ups on ups.user_id = member.user_id
    order by points desc, member.name asc
  `);
  return res.rows;
}

// Kelas milik user untuk dashboard
export async function getMyClasses(userId: string) {
  return db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      description: classrooms.description,
      code: classrooms.code,
      role: memberships.role,
      memberCount: sql<number>`(select count(*) from ${memberships} m2 where m2.classroom_id = ${classrooms.id})::int`,
      setCount: sql<number>`(select count(*) from ${questionSets} where ${questionSets.classroomId} = ${classrooms.id})::int`,
    })
    .from(memberships)
    .innerJoin(classrooms, eq(classrooms.id, memberships.classroomId))
    .where(eq(memberships.userId, userId))
    .orderBy(desc(memberships.joinedAt));
}

// Riwayat kuis terakhir user
export async function getRecentAttempts(userId: string, limit = 5) {
  return db
    .select({
      id: attempts.id,
      score: attempts.score,
      total: sql<number>`cardinality(${attempts.questionIds})::int`,
      finishedAt: attempts.finishedAt,
      createdAt: attempts.createdAt,
      setTitle: questionSets.title,
      classroomName: classrooms.name,
    })
    .from(attempts)
    .innerJoin(questionSets, eq(questionSets.id, attempts.setId))
    .innerJoin(classrooms, eq(classrooms.id, questionSets.classroomId))
    .where(and(eq(attempts.userId, userId), sql`${attempts.finishedAt} is not null`))
    .orderBy(desc(attempts.createdAt))
    .limit(limit);
}

// Soal bermasalah (dilaporkan) di kelas — untuk pemilik kelas
export async function getReportedQuestions(classroomId: string) {
  return db
    .select({
      questionId: questions.id,
      prompt: questions.prompt,
      setId: questionSets.id,
      setTitle: questionSets.title,
      authorName: users.name,
      openReports: openReportsSql,
      reasons: sql<string[]>`(select array_agg(${reports.reason}) from ${reports} where ${reports.questionId} = ${questions.id} and ${reports.resolved} = false)`,
    })
    .from(questions)
    .innerJoin(questionSets, eq(questionSets.id, questions.setId))
    .innerJoin(users, eq(users.id, questions.authorId))
    .where(and(eq(questionSets.classroomId, classroomId), sql`${openReportsSql} > 0`))
    .orderBy(desc(openReportsSql));
}
