CREATE TABLE "chatbot"."Skill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"owner_id" text,
	"provider_reference" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Skill_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chatbot"."UserSkill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"skill_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chatbot"."Skill" ADD CONSTRAINT "Skill_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "chatbot"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot"."UserSkill" ADD CONSTRAINT "UserSkill_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "chatbot"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot"."UserSkill" ADD CONSTRAINT "UserSkill_skill_id_Skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "chatbot"."Skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skill_ownerId_idx" ON "chatbot"."Skill" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "skill_isSystem_idx" ON "chatbot"."Skill" USING btree ("is_system");--> statement-breakpoint
CREATE INDEX "userSkill_userId_idx" ON "chatbot"."UserSkill" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "userSkill_skillId_idx" ON "chatbot"."UserSkill" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "userSkill_userId_skillId_idx" ON "chatbot"."UserSkill" USING btree ("user_id","skill_id");