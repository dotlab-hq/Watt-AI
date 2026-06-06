// import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { sso } from "@better-auth/sso";
import { generateId } from "ai";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export type UserType = "guest" | "regular";

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    type: UserType;
  };
}

export interface User {
  id?: string;
  email?: string | null;
  name?: string | null;
  type?: UserType;
}

export const betterAuthInstance = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: false,
  }),
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },
  user: {
    additionalFields: {
      type: {
        type: "string",
        required: false,
        defaultValue: "regular",
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoLogin: false,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  },
  plugins: [organization(), sso()],
});

/**
 * Server-side session getter. Drop-in replacement for NextAuth's auth().
 * Returns: { user: { id, email, name, type } } | null
 */
export async function auth(): Promise<Session | null> {
  const session = await betterAuthInstance.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const u = session.user as Record<string, unknown>;
  return {
    user: {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.name || "",
      type: (u.type as UserType) || "regular",
    },
  };
}

/**
 * Helper: forward the current request headers through Better Auth
 * by constructing a minimal Request and routing it through the handler.
 */
async function callAuthHandler(
  path: string,
  body: Record<string, unknown>
): Promise<Response> {
  const h = await headers();
  const headersRecord: Record<string, string> = {};
  h.forEach((value, key) => {
    headersRecord[key] = value;
  });

  const request = new Request(`${betterAuthInstance.options.baseURL}${path}`, {
    method: "POST",
    headers: {
      ...headersRecord,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return betterAuthInstance.handler(request);
}

/**
 * Server-side sign-in for email/password credentials.
 */
export async function signInCredentials(email: string, password: string) {
  const response = await callAuthHandler("/sign-in/email", { email, password });
  return response.json();
}

/**
 * Server-side sign-up for new users.
 */
export async function signUpEmail(email: string, password: string) {
  const response = await callAuthHandler("/sign-up/email", {
    email,
    password,
    name: "",
  });
  return response.json();
}

/**
 * Server-side guest sign-in. Creates an anonymous account.
 */
export async function signInGuest(redirectTo = "/") {
  const email = `guest-${Date.now()}`;
  const password = generateId();

  const response = await callAuthHandler("/sign-up/email", {
    email,
    password,
    name: "Guest",
  });

  const result = (await response.json()) as { user?: { id: string } };

  // Mark user as guest type via the update-user endpoint
  if (result?.user) {
    try {
      const h = await headers();
      const headersRecord: Record<string, string> = {};
      h.forEach((value, key) => {
        headersRecord[key] = value;
      });

      await betterAuthInstance.handler(
        new Request(`${betterAuthInstance.options.baseURL}/update-user`, {
          method: "POST",
          headers: {
            ...headersRecord,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: result.user.id,
            fields: { type: "guest" },
          }),
        })
      );
    } catch {
      // Non-critical
    }
  }

  redirect(redirectTo);
}

/**
 * Server-side sign-out.
 */
export async function signOut(opts?: { redirectTo?: string }) {
  const h = await headers();
  const headersRecord: Record<string, string> = {};
  h.forEach((value, key) => {
    headersRecord[key] = value;
  });

  await betterAuthInstance.handler(
    new Request(`${betterAuthInstance.options.baseURL}/sign-out`, {
      method: "POST",
      headers: {
        ...headersRecord,
        "Content-Type": "application/json",
      },
      body: "{}",
    })
  );

  if (opts?.redirectTo) {
    redirect(opts.redirectTo);
  }
}

/** Route handler for the catch-all API route */
export const handler = betterAuthInstance.handler;
