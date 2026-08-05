import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const seedreamJobs = sqliteTable(
  "seedream_jobs",
  {
    id: text("id").primaryKey(),
    resumeTokenHash: text("resume_token_hash").notNull(),
    status: text("status", {
      enum: ["pending", "running", "succeeded", "failed"],
    }).notNull(),
    responseJson: text("response_json"),
    error: text("error"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [index("idx_seedream_jobs_expires_at").on(table.expiresAt)],
);
