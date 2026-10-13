"use server";

import { z } from "zod";
import { generatorInputSchema, type GeneratorField, type GeneratorInput } from "@/lib/workout/schema";

export type GenerateState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Partial<Record<GeneratorField, string[]>> }
  | { status: "ready"; input: GeneratorInput };

export async function generateWorkout(_prev: GenerateState, formData: FormData): Promise<GenerateState> {
  const parsed = generatorInputSchema.safeParse({
    pool: formData.get("pool"),
    targetMode: formData.get("targetMode"),
    totalDistance: formData.get("totalDistance"),
    durationMinutes: formData.get("durationMinutes"),
    level: formData.get("level"),
    focus: formData.get("focus"),
    strokes: formData.getAll("strokes"),
    equipment: formData.getAll("equipment"),
    baseInterval: formData.get("baseInterval"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // Step 2 replaces this with the Claude draft + validation pass.
  return { status: "ready", input: parsed.data };
}
