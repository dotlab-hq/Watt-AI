CREATE TABLE "chatbot"."UserKeyPair" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"public_key" text NOT NULL,
	"encrypted_private_key" text NOT NULL,
	"key_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserKeyPair_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "chatbot"."Message_v2" ADD COLUMN "pii_map" text;--> statement-breakpoint
ALTER TABLE "chatbot"."UserKeyPair" ADD CONSTRAINT "UserKeyPair_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "chatbot"."user"("id") ON DELETE cascade ON UPDATE no action;