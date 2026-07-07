import { eq } from "drizzle-orm";
import { type UploadedAsset, uploadedAsset } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import { db } from "./db";

export async function saveUploadedAsset({
  userId,
  chatId,
  s3Key,
  s3Url,
  filename,
  mediaType,
  providerReference,
}: {
  userId: string;
  chatId: string | null;
  s3Key: string;
  s3Url: string;
  filename: string;
  mediaType: string;
  providerReference?: Record<string, string>;
}): Promise<UploadedAsset> {
  try {
    const rows = await db
      .insert(uploadedAsset)
      .values({
        userId,
        chatId,
        s3Key,
        s3Url,
        filename,
        mediaType,
        providerReference,
        createdAt: new Date(),
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.error("[db] saveUploadedAsset failed:", error);
    throw new ChatbotError(
      "bad_request:database",
      "Failed to save uploaded asset"
    );
  }
}

export async function getUploadedAssetsByChatId({
  chatId,
}: {
  chatId: string;
}): Promise<UploadedAsset[]> {
  try {
    return await db
      .select()
      .from(uploadedAsset)
      .where(eq(uploadedAsset.chatId, chatId));
  } catch (error) {
    console.error("[db] getUploadedAssetsByChatId failed:", error);
    return [];
  }
}

export async function getUploadedAssetById({
  id,
}: {
  id: string;
}): Promise<UploadedAsset | undefined> {
  try {
    const rows = await db
      .select()
      .from(uploadedAsset)
      .where(eq(uploadedAsset.id, id))
      .limit(1);
    return rows[0];
  } catch (error) {
    console.error("[db] getUploadedAssetById failed:", error);
    return undefined;
  }
}
