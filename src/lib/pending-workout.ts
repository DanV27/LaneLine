import type { SaveWorkoutInput } from "@/app/workouts/actions";

// A guest's workout waits here while they sign in. localStorage (not sessionStorage)
// because the magic link usually opens in a new tab.
const KEY = "laneline:pending-workout";

export function stashPendingWorkout(workout: SaveWorkoutInput) {
  try {
    localStorage.setItem(KEY, JSON.stringify(workout));
  } catch {
    // Storage unavailable (private mode): the user will just need to generate again.
  }
}

export function takePendingWorkout(): SaveWorkoutInput | null {
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    return raw ? (JSON.parse(raw) as SaveWorkoutInput) : null;
  } catch {
    return null;
  }
}
