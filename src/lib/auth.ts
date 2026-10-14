import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { headers } from "next/headers";
import { Resend } from "resend";
import { db } from "@/lib/db";

export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

async function sendMagicLink({ email, url }: { email: string; url: string }) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is required to send sign-in emails.");
    // Local development without an email provider: print the link instead.
    console.info(`\n🔗 Magic sign-in link for ${email}:\n${url}\n`);
    return;
  }

  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.EMAIL_FROM ?? "LaneLine <onboarding@resend.dev>",
    to: email,
    subject: "Your LaneLine sign-in link",
    text: `Sign in to LaneLine:\n\n${url}\n\nThis link expires in 10 minutes. If you didn't ask for it, you can ignore this email.`,
  });
  if (error) throw new Error(`Couldn't send the sign-in email: ${error.message}`);
}

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  socialProviders: googleEnabled
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } }
    : {},
  plugins: [
    magicLink({ sendMagicLink, expiresIn: 60 * 10 }),
    // Must be last: lets server actions set auth cookies.
    nextCookies(),
  ],
});

export type CurrentUser = { id: string; name: string; email: string; image?: string | null };

/** The signed-in user, or null in guest mode. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
