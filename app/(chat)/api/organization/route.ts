import { headers } from "next/headers";
import { auth, betterAuthInstance } from "@/app/(auth)/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const h = await headers();
  const response = await betterAuthInstance.handler(
    new Request(`${betterAuthInstance.options.baseURL}/organization/list`, {
      method: "GET",
      headers: Object.fromEntries(h.entries()),
    })
  );

  return response;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const h = await headers();

  const response = await betterAuthInstance.handler(
    new Request(`${betterAuthInstance.options.baseURL}/organization/create`, {
      method: "POST",
      headers: {
        ...Object.fromEntries(h.entries()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
  );

  return response;
}
