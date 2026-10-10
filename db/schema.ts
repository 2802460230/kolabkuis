// Skema basis data KolabKuis (Drizzle ORM + PostgreSQL)
// Alur relasi: users — memberships — classrooms — question_sets — questions
import {
  pgTable, pgEnum, text, integer, boolean, timestamp, primaryKey, unique, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@/lib/id";

const id = () => text("id").primaryKey().$defaultFn(createId);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const roleEnum = pgEnum("role", ["OWNER", "MEMBER"]);
export const difficultyEnum = pgEnum("difficulty", ["MUDAH", "SEDANG", "SULIT"]);

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  university: text("university"),
  createdAt: createdAt(),
});

export const classrooms = pgTable("classrooms", {
  id: id(),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").notNull().unique(), // kode undangan 6 karakter
  ownerId: text("owner_id").notNull().references(() => users.id),
  createdAt: createdAt(),
});

export const memberships = pgTable("memberships", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  classroomId: text("classroom_id").notNull().references(() => classrooms.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull().default("MEMBER"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.classroomId] })]);

export const questionSets = pgTable("question_sets", {
  id: id(),
  classroomId: text("classroom_id").notNull().references(() => classrooms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdAt: createdAt(),
}, (t) => [index("sets_classroom_idx").on(t.classroomId)]);

export const questions = pgTable("questions", {
  id: id(),
  setId: text("set_id").notNull().references(() => questionSets.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id),
  prompt: text("prompt").notNull(),
  options: text("options").array().notNull(), // 4 pilihan jawaban A–D
  correctIndex: integer("correct_index").notNull(), // tidak pernah dikirim ke browser saat kuis
  explanation: text("explanation").notNull(),
  difficulty: difficultyEnum("difficulty").notNull().default("SEDANG"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [index("questions_set_idx").on(t.setId)]);

export const votes = pgTable("votes", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  value: integer("value").notNull(), // +1 atau -1
}, (t) => [primaryKey({ columns: [t.userId, t.questionId] })]);

export const reports = pgTable("reports", {
  id: id(),
  questionId: text("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: createdAt(),
}, (t) => [unique("reports_question_user").on(t.questionId, t.userId)]);

export const attempts = pgTable("attempts", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  setId: text("set_id").notNull().references(() => questionSets.id, { onDelete: "cascade" }),
  questionIds: text("question_ids").array().notNull(), // soal yang diundi untuk sesi ini
  score: integer("score").notNull().default(0),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const attemptAnswers = pgTable("attempt_answers", {
  id: id(),
  attemptId: text("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  chosenIndex: integer("chosen_index").notNull(),
  correct: boolean("correct").notNull(),
}, (t) => [unique("answers_attempt_question").on(t.attemptId, t.questionId)]);

// Relasi untuk query bertingkat (db.query.*)
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  questions: many(questions),
}));
export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  owner: one(users, { fields: [classrooms.ownerId], references: [users.id] }),
  members: many(memberships),
  sets: many(questionSets),
}));
export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  classroom: one(classrooms, { fields: [memberships.classroomId], references: [classrooms.id] }),
}));
export const questionSetsRelations = relations(questionSets, ({ one, many }) => ({
  classroom: one(classrooms, { fields: [questionSets.classroomId], references: [classrooms.id] }),
  createdBy: one(users, { fields: [questionSets.createdById], references: [users.id] }),
  questions: many(questions),
}));
export const questionsRelations = relations(questions, ({ one, many }) => ({
  set: one(questionSets, { fields: [questions.setId], references: [questionSets.id] }),
  author: one(users, { fields: [questions.authorId], references: [users.id] }),
  votes: many(votes),
  reports: many(reports),
}));
export const votesRelations = relations(votes, ({ one }) => ({
  question: one(questions, { fields: [votes.questionId], references: [questions.id] }),
}));
export const reportsRelations = relations(reports, ({ one }) => ({
  question: one(questions, { fields: [reports.questionId], references: [questions.id] }),
  user: one(users, { fields: [reports.userId], references: [users.id] }),
}));
export const attemptsRelations = relations(attempts, ({ one, many }) => ({
  user: one(users, { fields: [attempts.userId], references: [users.id] }),
  set: one(questionSets, { fields: [attempts.setId], references: [questionSets.id] }),
  answers: many(attemptAnswers),
}));
export const attemptAnswersRelations = relations(attemptAnswers, ({ one }) => ({
  attempt: one(attempts, { fields: [attemptAnswers.attemptId], references: [attempts.id] }),
  question: one(questions, { fields: [attemptAnswers.questionId], references: [questions.id] }),
}));
