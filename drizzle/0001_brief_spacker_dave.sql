CREATE TABLE "hub_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_preview" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "hub_api_keys_key_hash_unique" UNIQUE("key_hash")
);
