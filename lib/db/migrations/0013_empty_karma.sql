CREATE TABLE "chatbot"."UploadedAsset" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"chatId" uuid,
	"s3Key" text NOT NULL,
	"s3Url" text NOT NULL,
	"filename" text NOT NULL,
	"mediaType" text NOT NULL,
	"providerReference" json,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chatbot"."UploadedAsset" ADD CONSTRAINT "UploadedAsset_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "chatbot"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot"."UploadedAsset" ADD CONSTRAINT "UploadedAsset_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "chatbot"."Chat"("id") ON DELETE set null ON UPDATE no action;