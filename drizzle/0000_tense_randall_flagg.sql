CREATE TYPE "public"."hub_artifact_type" AS ENUM('html', 'image', 'pdf', 'other');--> statement-breakpoint
CREATE TABLE "hub_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "hub_artifact_type" DEFAULT 'other' NOT NULL,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"mime_type" text DEFAULT 'application/octet-stream' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"author_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hub_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_id" uuid NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"rating" integer,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hub_share_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"max_views" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	CONSTRAINT "hub_share_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "hub_feedback" ADD CONSTRAINT "hub_feedback_artifact_id_hub_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."hub_artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hub_share_links" ADD CONSTRAINT "hub_share_links_artifact_id_hub_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."hub_artifacts"("id") ON DELETE cascade ON UPDATE no action;