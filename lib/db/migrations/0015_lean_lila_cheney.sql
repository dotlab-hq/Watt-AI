ALTER TABLE "chatbot"."Chat" ADD COLUMN "updatedAt" timestamp NOT NULL DEFAULT now();
UPDATE "chatbot"."Chat" SET "updatedAt" = "createdAt";
