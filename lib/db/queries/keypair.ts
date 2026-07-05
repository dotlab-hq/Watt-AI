import { eq } from "drizzle-orm";
import { type UserKeyPair, userKeyPair } from "@/lib/db/schema";
import { db } from "./db";

export async function getUserKeyPair({
  userId,
}: {
  userId: string;
}): Promise<UserKeyPair | null> {
  const [kp] = await db
    .select()
    .from(userKeyPair)
    .where(eq(userKeyPair.userId, userId));
  return kp ?? null;
}

export async function upsertUserKeyPair({
  userId,
  publicKey,
  encryptedPrivateKey,
}: {
  userId: string;
  publicKey: string;
  encryptedPrivateKey: string;
}): Promise<UserKeyPair> {
  const [existing] = await db
    .select()
    .from(userKeyPair)
    .where(eq(userKeyPair.userId, userId));

  if (existing) {
    const [updated] = await db
      .update(userKeyPair)
      .set({
        publicKey,
        encryptedPrivateKey,
        keyVersion: existing.keyVersion + 1,
        updatedAt: new Date(),
      })
      .where(eq(userKeyPair.userId, userId))
      .returning();
    return updated!;
  }

  const [created] = await db
    .insert(userKeyPair)
    .values({ userId, publicKey, encryptedPrivateKey })
    .returning();
  return created!;
}
