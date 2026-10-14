import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/Spinner";
import { getCurrentUser } from "@/lib/auth";
import { ImportPendingWorkout } from "./ImportPendingWorkout";

/** Where guests land after signing in from "Sign in to save": saves the workout they were editing. */
export default function ImportPage() {
  return (
    <Suspense fallback={<Spinner label="Saving your workout" />}>
      <SignedInImport />
    </Suspense>
  );
}

async function SignedInImport() {
  if (!(await getCurrentUser())) redirect("/signin?next=/workouts/import");
  return <ImportPendingWorkout />;
}
