"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/** Nav links and the account area. Reads the session in the browser so the header stays static. */
export function HeaderNav() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <nav className="ml-8 flex gap-5 text-sm font-medium text-slate-600">
        <Link href="/" className="hover:text-slate-900">
          Generate
        </Link>
        {session && (
          <>
            <Link href="/workouts" className="hover:text-slate-900">
              My workouts
            </Link>
            <Link href="/library" className="hover:text-slate-900">
              Library
            </Link>
          </>
        )}
      </nav>
      <div className="ml-auto text-sm">
        {isPending ? null : session ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-slate-500 sm:inline">{session.user.email}</span>
            <button type="button" onClick={signOut} className="font-medium text-slate-600 hover:text-slate-900">
              Sign out
            </button>
          </div>
        ) : (
          <Link href="/signin" className="font-semibold text-sky-700 hover:text-sky-900">
            Sign in
          </Link>
        )}
      </div>
    </>
  );
}
