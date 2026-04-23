import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const artifactTypeEnum = pgEnum("hub_artifact_type", [
  "html",
  "image",
  "pdf",
  "other",
]);

export const artifacts = pgTable("hub_artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: artifactTypeEnum("type").notNull().default("other"),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  mimeType: text("mime_type").notNull().default("application/octet-stream"),
  tags: text("tags")
    .array()
    .notNull()
    .default([]),
  authorEmail: text("author_email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const feedback = pgTable("hub_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  artifactId: uuid("artifact_id")
    .references(() => artifacts.id, { onDelete: "cascade" })
    .notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  rating: integer("rating"),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const shareLinks = pgTable("hub_share_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  artifactId: uuid("artifact_id")
    .references(() => artifacts.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  maxViews: integer("max_views"),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdBy: text("created_by").notNull(),
});

export const apiKeys = pgTable("hub_api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userEmail: text("user_email").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPreview: text("key_preview").notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

// Type exports
export type Artifact = typeof artifacts.$inferSelect;
export type NewArtifact = typeof artifacts.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
export type ShareLink = typeof shareLinks.$inferSelect;
export type NewShareLink = typeof shareLinks.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
