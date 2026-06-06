import { auth, betterAuthInstance } from "@/app/(auth)/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const h = await headers();

  try {
    const response = await betterAuthInstance.handler(
      new Request(
        `${betterAuthInstance.options.baseURL}/sso/providers`,
        {
          method: "GET",
          headers: Object.fromEntries(h.entries()),
        },
      ),
    );
    return response;
  } catch {
    return Response.json([]);
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const h = await headers();

  const response = await betterAuthInstance.handler(
    new Request(
      `${betterAuthInstance.options.baseURL}/sso/register`,
      {
        method: "POST",
        headers: {
          ...Object.fromEntries(h.entries()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    ),
  );

  return response;
}
