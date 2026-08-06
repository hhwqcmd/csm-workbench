import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

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

export const materialAssets = sqliteTable(
  "material_assets",
  {
    id: text("id").primaryKey(),
    kind: text("kind", { enum: ["video", "image", "audio"] }).notNull(),
    objectKey: text("object_key").notNull(),
    name: text("name").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    createdAt: text("created_at").notNull(),
    source: text("source", {
      enum: ["seedance", "seedream", "manual"],
    }).notNull(),
    sourceRef: text("source_ref").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_material_assets_object_key").on(table.objectKey),
    index("idx_material_assets_created_at").on(table.createdAt),
  ],
);
