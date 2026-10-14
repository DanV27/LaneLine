import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { Spinner } from "@/components/Spinner";
import { getCurrentUser, googleEnabled } from "@/lib/auth";
import { safeNext } from "@/lib/redirect";

export default function SignInPage({ searchParams }: PageProps<"/signin">) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to LaneLine</h1>
      <p className="mt-2 text-sm text-slate-600">
        Save workouts, build a set library, and pick up where you left off. You can keep generating workouts without
        an account.
      </p>
      <Suspense fallback={<Spinner />}>
        <SignIn searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SignIn({ searchParams }: Pick<PageProps<"/signin">, "searchParams">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  return (
    <SignInForm
      next={next}
      googleEnabled={googleEnabled}
      linksInConsole={!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production"}
    />
  );
}
