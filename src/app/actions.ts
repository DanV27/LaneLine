"use server";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  generateWorkout as runGenerator,
  GenerationError,
  rerollSection as runReroll,
  type GeneratedWorkout,
} from "@/lib/generator/generate";
import {
  generatorInputSchema,
  workoutContentSchema,
  workoutContextSchema,
  type GeneratorField,
  type Section,
  type WorkoutContent,
  type WorkoutContext,
} from "@/lib/workout/schema";

export type GenerateState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Partial<Record<GeneratorField, string[]>> }
  | { status: "error"; message: string }
  // `id` changes on every generation so the editor resets its local edits.
  | { status: "ready"; id: string; workout: GeneratedWorkout };

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

  try {
    const workout = await runGenerator(parsed.data);
    return { status: "ready", id: crypto.randomUUID(), workout };
  } catch (error) {
    return { status: "error", message: describeError(error) };
  }
}

export type RerollResult = { ok: true; section: Section } | { ok: false; message: string };

const rerollArgsSchema = z.object({
  context: workoutContextSchema,
  content: workoutContentSchema,
  sectionId: z.string(),
});

export async function rerollSection(
  context: WorkoutContext,
  content: WorkoutContent,
  sectionId: string,
): Promise<RerollResult> {
  // Server actions accept anything from the client, so re-validate the edited workout.
  const parsed = rerollArgsSchema.safeParse({ context, content, sectionId });
  if (!parsed.success) {
    return { ok: false, message: "This workout couldn't be read. Try generating it again." };
  }

  try {
    const section = await runReroll(parsed.data.context, parsed.data.content, parsed.data.sectionId);
    return { ok: true, section };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }
}

function describeError(error: unknown): string {
  if (error instanceof GenerationError) return error.message;
  if (error instanceof Anthropic.AuthenticationError) {
    return "The Anthropic API key is missing or invalid. Set ANTHROPIC_API_KEY in .env and restart the server.";
  }
  if (error instanceof Anthropic.RateLimitError) return "The generator is busy right now. Try again in a minute.";
  if (error instanceof Anthropic.APIConnectionError) return "Couldn't reach the generator. Check your connection.";
  if (error instanceof Anthropic.APIError) return `The generator hit an error (${error.status}). Please try again.`;
  console.error(error);
  return "Something went wrong generating the workout. Please try again.";
}
