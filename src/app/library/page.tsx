import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { inputClass } from "@/components/generator/fields";
import { Spinner } from "@/components/Spinner";
import { SectionView } from "@/components/workout/SectionView";
import { getCurrentUser } from "@/lib/auth";
import { listSavedSets, listTags } from "@/lib/data";
import { deleteSet } from "./actions";

export default function LibraryPage({ searchParams }: PageProps<"/library">) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Set library</h1>
      <p className="mt-2 text-slate-600">
        Sections you&apos;ve saved. Add them to any workout from the editor with <strong>Add from library</strong>.
      </p>
      <Suspense fallback={<Spinner />}>
        <Library searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Library({ searchParams }: Pick<PageProps<"/library">, "searchParams">) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/library");

  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const tag = typeof params.tag === "string" ? params.tag : "";
  const [sets, tags] = await Promise.all([
    listSavedSets(user.id, { search: search || undefined, tag: tag || undefined }),
    listTags(user.id),
  ]);

  return (
    <>
      <form className="mt-6 flex gap-2">
        {tag && <input type="hidden" name="tag" value={tag} />}
        <input name="q" defaultValue={search} placeholder="Search by title" aria-label="Search sets" className={inputClass} />
      </form>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link
            href={search ? `/library?q=${encodeURIComponent(search)}` : "/library"}
            className={`rounded-full border px-3 py-1 ${!tag ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 text-slate-600 hover:border-sky-400"}`}
          >
            All
          </Link>
          {tags.map((name) => (
            <Link
              key={name}
              href={`/library?${new URLSearchParams({ ...(search ? { q: search } : {}), tag: name })}`}
              className={`rounded-full border px-3 py-1 ${tag === name ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 text-slate-600 hover:border-sky-400"}`}
            >
              {name}
            </Link>
          ))}
        </div>
      )}

      {sets.length === 0 ? (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">
          {search || tag
            ? "No sets match these filters."
            : "Your library is empty. Use Save to library on any section of a workout to add it here."}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {sets.map((set) => (
            <li key={set.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{set.title}</p>
                  <p className="text-sm text-slate-500">
                    {set.totalDistance.toLocaleString()} {set.pool === "SCY" ? "yds" : "m"} · {set.pool}
                    {set.tags.length > 0 && ` · ${set.tags.join(", ")}`}
                  </p>
                </div>
                <form action={deleteSet.bind(null, set.id)}>
                  <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
                    Delete
                  </button>
                </form>
              </div>
              <SectionView section={set.section} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
