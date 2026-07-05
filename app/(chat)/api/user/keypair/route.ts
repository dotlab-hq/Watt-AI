import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getUserKeyPair, upsertUserKeyPair } from "@/lib/db/queries/keypair";
import { getUserById } from "@/lib/db/queries";

const createKeyPairSchema = z.object({
  publicKey: z.string(),
  encryptedPrivateKey: z.string(),
});

async function requireVerifiedUser() {
  const session = await auth();
  if (!session?.user) return { error: Response.json({ error: "unauthorized" }, { status: 401 }) };
  const user = await getUserById({ userId: session.user.id });
  if (!user?.emailVerified) return { error: Response.json({ error: "email not verified" }, { status: 403 }) };
  return { userId: session.user.id };
}

/** GET — return the user's key pair (encrypted private key stays encrypted). */
export async function GET() {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth.error;

  const kp = await getUserKeyPair({ userId: auth.userId });
  if (!kp) {
    return Response.json({ exists: false });
  }
  return Response.json({
    exists: true,
    publicKey: kp.publicKey,
    encryptedPrivateKey: kp.encryptedPrivateKey,
    keyVersion: kp.keyVersion,
  });
}

/** POST — create or rotate the user's key pair. */
export async function POST(request: Request) {
  const authResult = await requireVerifiedUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json();
  const parsed = createKeyPairSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const kp = await upsertUserKeyPair({
    userId: authResult.userId,
    publicKey: parsed.data.publicKey,
    encryptedPrivateKey: parsed.data.encryptedPrivateKey,
  });

  return Response.json({ keyVersion: kp.keyVersion });
}
