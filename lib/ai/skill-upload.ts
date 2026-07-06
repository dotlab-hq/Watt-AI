import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { uploadFile } from "ai";
import { isTestEnvironment } from "@/lib/constants";

/**
 * Upload skill content to available providers and return a merged
 * ProviderReference (Record<providerName, fileId>) as a JSON string
 * that can be stored in the DB and later passed via providerOptions
 * during inference.
 *
 * Uploads to every configured provider (checks for API keys) so the
 * skill reference works regardless of which provider is used at chat
 * time.
 *
 * In test environments, returns null (no upload needed for mocks).
 */
export async function uploadSkillToProviders(
  skillName: string,
  content: string
): Promise<string | null> {
  if (isTestEnvironment) {
    return null;
  }

  const filename = `${skillName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.txt`;
  const data = new TextEncoder().encode(content);
  const mergedRef: Record<string, string> = {};

  // Upload to Anthropic if configured
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await uploadFile({
        api: anthropic,
        data,
        filename,
        mediaType: "text/plain",
      });
      Object.assign(mergedRef, result.providerReference);
    } catch {
      // non-critical, continue without Anthropic reference
    }
  }

  // Upload to OpenAI if configured
  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await uploadFile({
        api: openai,
        data,
        filename,
        mediaType: "text/plain",
        providerOptions: {
          openai: { purpose: "assistants" },
        },
      });
      Object.assign(mergedRef, result.providerReference);
    } catch {
      // non-critical, continue without OpenAI reference
    }
  }

  // Only return if we got at least one reference
  if (Object.keys(mergedRef).length === 0) {
    return null;
  }

  return JSON.stringify(mergedRef);
}

/**
 * Delete skill content from providers using the stored provider
 * reference. Best-effort — failures are silently ignored.
 */
export async function deleteSkillFromProviders(
  providerReference: string
): Promise<void> {
  if (isTestEnvironment) {
    return;
  }

  let ref: Record<string, string>;
  try {
    ref = JSON.parse(providerReference) as Record<string, string>;
  } catch {
    return;
  }

  const providers = [
    { key: "anthropic", api: anthropic },
    { key: "openai", api: openai },
  ] as const;

  await Promise.allSettled(
    providers.map(async ({ key, api }) => {
      const fileId = ref[key];
      if (!fileId) {
        return;
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filesApi = (api as any).files();
        await filesApi.deleteFile(fileId);
      } catch {
        // non-critical
      }
    })
  );
}
