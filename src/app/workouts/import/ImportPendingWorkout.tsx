"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { takePendingWorkout } from "@/lib/pending-workout";
import { saveWorkout } from "../actions";

export function ImportPendingWorkout() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // Strict mode runs effects twice in dev; only import once.
    if (started.current) return;
    started.current = true;

    const pending = takePendingWorkout();
    if (!pending) {
      router.replace("/workouts");
      return;
    }
    saveWorkout(pending).then((result) => {
      if (result.ok) router.replace(`/workouts/${result.id}`);
      else setError(result.message);
    });
  }, [router]);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16 text-center">
      {error ? (
        <p role="alert" className="text-red-700">
          Couldn&apos;t save your workout: {error}
        </p>
      ) : (
        <p className="text-slate-600">Saving your workout…</p>
      )}
    </main>
  );
}
