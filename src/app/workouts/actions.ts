"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { targetSchema, workoutContentSchema, workoutContextSchema } from "@/lib/workout/schema";
import { estimateSeconds, workoutDistance } from "@/lib/workout/totals";

const saveWorkoutSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Give the workout a title").max(80),
  content: workoutContentSchema,
  context: workoutContextSchema,
  target: targetSchema,
});

export type SaveWorkoutInput = z.input<typeof saveWorkoutSchema>;
export type SaveWorkoutResult = { ok: true; id: string } | { ok: false; message: string };

/** Creates the workout, or updates it when `id` is given. */
export async function saveWorkout(input: SaveWorkoutInput): Promise<SaveWorkoutResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to save workouts." };

  const parsed = saveWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "This workout couldn't be saved." };
  }

  const { id, title, content, context, target } = parsed.data;
  const data = {
    title,
    pool: context.pool,
    level: context.level,
    focus: context.focus,
    totalDistance: workoutDistance(content),
    estimatedSeconds: estimateSeconds(content, context.basePace),
    content,
    params: { context, target },
  };

  if (id) {
    const { count } = await db.workout.updateMany({ where: { id, userId: user.id }, data });
    if (count === 0) return { ok: false, message: "That workout no longer exists." };
    revalidatePath("/workouts");
    revalidatePath(`/workouts/${id}`);
    return { ok: true, id };
  }

  const created = await db.workout.create({ data: { ...data, userId: user.id } });
  revalidatePath("/workouts");
  return { ok: true, id: created.id };
}

export async function deleteWorkout(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/workouts");

  await db.workout.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/workouts");
  redirect("/workouts");
}
