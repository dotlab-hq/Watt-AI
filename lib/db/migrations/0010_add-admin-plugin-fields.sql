ALTER TABLE "chatbot"."session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "chatbot"."user" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "chatbot"."user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "chatbot"."user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "chatbot"."user" ADD COLUMN "ban_expires" timestamp;