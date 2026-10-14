import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { inputClass } from "@/components/generator/fields";
import { Spinner } from "@/components/Spinner";
import { getCurrentUser } from "@/lib/auth";
import { listWorkouts } from "@/lib/data";
import { formatDuration } from "@/lib/workout/format";
import { FOCUS_OPTIONS, LEVEL_OPTIONS, labelFor } from "@/lib/workout/options";

export default function WorkoutsPage({ searchParams }: PageProps<"/workouts">) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My workouts</h1>
          <p className="mt-2 text-slate-600">Workouts you&apos;ve saved. Open one to edit, re-roll or reuse it.</p>
        </div>
        <Link href="/" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          New workout
        </Link>
      </div>

      <Suspense fallback={<Spinner />}>
        <WorkoutList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function WorkoutList({ searchParams }: Pick<PageProps<"/workouts">, "searchParams">) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/workouts");

  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";
  const workouts = await listWorkouts(user.id, search || undefined);

  return (
    <>
      <form className="mt-6">
        <input name="q" defaultValue={search} placeholder="Search by title" aria-label="Search workouts" className={inputClass} />
      </form>

      {workouts.length === 0 ? (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">
          {search ? `No workouts match “${search}”.` : "No saved workouts yet. Generate one and hit Save."}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {workouts.map((workout) => (
            <li key={workout.id}>
              <Link href={`/workouts/${workout.id}`} className="flex items-center gap-4 p-5 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{workout.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {labelFor(FOCUS_OPTIONS, workout.focus)} · {labelFor(LEVEL_OPTIONS, workout.level)} · {workout.pool}
                  </p>
                </div>
                <div className="text-right text-sm tabular-nums">
                  <p className="font-semibold text-slate-900">
                    {workout.totalDistance.toLocaleString()} {workout.pool === "SCY" ? "yds" : "m"}
                  </p>
                  <p className="text-slate-500">
                    {workout.estimatedSeconds ? formatDuration(workout.estimatedSeconds) : "—"} ·{" "}
                    {workout.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
