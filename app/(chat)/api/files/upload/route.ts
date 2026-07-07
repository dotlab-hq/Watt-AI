import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { uploadFile } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { saveUploadedAsset } from "@/lib/db/queries/uploaded-assets";
import { uploadToS3 } from "@/lib/s3";

const FileSchema = z.object({
  file: z.instanceof(Blob).refine((file) => file.size <= 50 * 1024 * 1024, {
    message: "File size should be less than 50MB",
  }),
});

/**
 * Upload a file to all configured AI providers and return merged references.
 * The caller uses `providerReference` (a Record<string, string>) to send the
 * file to any supported provider at inference time — no S3 URL required.
 */
async function uploadToProviders(params: {
  data: Uint8Array;
  filename: string;
  mediaType: string;
}): Promise<Record<string, string>> {
  const { data, filename, mediaType } = params;

  // Build a list of provider upload promises. Each entry is a
  // [providerName, uploadResult] tuple. Providers that aren't configured will
  // throw at import-time, so we swallow those errors gracefully.
  const providers: Array<{
    name: string;
    api: Parameters<typeof uploadFile>[0]["api"];
  }> = [
    { name: "openai", api: openai },
    { name: "anthropic", api: anthropic },
  ];

  const results = await Promise.allSettled(
    providers.map(async ({ name, api }) => {
      const uploadParams: Parameters<typeof uploadFile>[0] = {
        api,
        data,
        filename,
        mediaType,
      };
      if (name === "openai") {
        uploadParams.providerOptions = {
          openai: { purpose: "assistants" },
        };
      }
      console.log(`[file-upload] Uploading "${filename}" to ${name}...`);
      const result = await uploadFile(uploadParams);
      console.log(
        `[file-upload] ${name} upload succeeded:`,
        result.providerReference
      );
      return [name, result.providerReference] as const;
    })
  );

  const merged: Record<string, string> = {};
  for (const r of results) {
    if (r.status === "fulfilled") {
      const [, ref] = r.value;
      // ref is a Record<string, string> keyed by provider — flatten it
      Object.assign(merged, ref);
    } else {
      console.warn("[file-upload] provider upload failed:", r.reason);
    }
  }

  return merged;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const chatId = formData.get("chatId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (formData.get("file") as File).name;
    const mediaType =
      (formData.get("file") as File).type || "application/octet-stream";
    const fileBuffer = await file.arrayBuffer();
    const data = new Uint8Array(fileBuffer);

    try {
      // Upload to AI providers in parallel with S3 upload
      const [providerReference, s3Result] = await Promise.all([
        uploadToProviders({ data, filename, mediaType }),
        uploadToS3({
          userId: session.user.id,
          chatId: chatId || "unknown",
          filename,
          mediaType,
          data,
        }).catch((err) => {
          console.warn("[file-upload] S3 upload failed (non-fatal):", err);
          return null;
        }),
      ]);

      if (Object.keys(providerReference).length === 0) {
        return NextResponse.json(
          { error: "No provider accepted the file upload" },
          { status: 500 }
        );
      }

      // Save the asset mapping to DB for visual display
      let s3Url: string | null = null;
      if (s3Result) {
        try {
          await saveUploadedAsset({
            userId: session.user.id,
            chatId: chatId || null,
            s3Key: s3Result.s3Key,
            s3Url: s3Result.s3Url,
            filename,
            mediaType,
            providerReference,
          });
          s3Url = s3Result.s3Url;
          console.log(
            `[file-upload] Saved asset mapping to DB, s3Url: ${s3Url}`
          );
        } catch (err) {
          console.warn(
            "[file-upload] Failed to save asset mapping (non-fatal):",
            err
          );
          // Still return the S3 URL even if DB save fails
          s3Url = s3Result.s3Url;
        }
      }

      console.log(
        `File uploaded to providers: ${Object.keys(providerReference).join(", ")} —`,
        filename
      );

      return NextResponse.json({
        providerReference,
        mediaType,
        filename,
        s3Url,
      });
    } catch (_error) {
      console.log("Provider upload error:", _error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
