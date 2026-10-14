import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/Spinner";
import { WorkoutEditor } from "@/components/workout/WorkoutEditor";
import { getCurrentUser } from "@/lib/auth";
import { getWorkout } from "@/lib/data";
import { deleteWorkout } from "../actions";

export default function WorkoutPage({ params }: PageProps<"/workouts/[id]">) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Suspense fallback={<Spinner />}>
        <SavedWorkout params={params} />
      </Suspense>
    </main>
  );
}

async function SavedWorkout({ params }: Pick<PageProps<"/workouts/[id]">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?next=/workouts/${id}`);

  const workout = await getWorkout(id, user.id);
  if (!workout) notFound();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/workouts" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← My workouts
        </Link>
        <form action={deleteWorkout.bind(null, workout.id)}>
          <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
            Delete workout
          </button>
        </form>
      </div>
      <WorkoutEditor key={workout.updatedAt.toISOString()} workout={workout} savedId={workout.id} signedIn />
    </>
  );
}
