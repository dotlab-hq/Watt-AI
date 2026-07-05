ALTER TABLE "chatbot"."Personalization" ADD COLUMN "base_style" varchar DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot"."Personalization" ADD COLUMN "warm" varchar DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot"."Personalization" ADD COLUMN "enthusiastic" varchar DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot"."Personalization" ADD COLUMN "headers_and_lists" varchar DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot"."Personalization" ADD COLUMN "emoji" varchar DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot"."Personalization" ADD COLUMN "custom_instructions" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "chatbot"."Personalization" ADD COLUMN "nickname" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "chatbot"."Personalization" ADD COLUMN "occupation" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "chatbot"."Personalization" ADD COLUMN "more_about_you" text DEFAULT '';