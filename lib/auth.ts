import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { sso } from "@better-auth/sso";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { db } from "@/lib/db";
import {
  chat as chatModel,
  document as documentModel,
  message as messageModel,
  stream as streamModel,
  suggestion as suggestionModel,
  user as userModel,
  vote as voteModel,
} from "@/lib/db/schema";

export type UserType = "guest" | "regular";

const schema = {
  user: userModel,
  chat: chatModel,
  message: messageModel,
  vote: voteModel,
  document: documentModel,
  suggestion: suggestionModel,
  stream: streamModel,
};

const auth = betterAuth({
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

export { auth };
