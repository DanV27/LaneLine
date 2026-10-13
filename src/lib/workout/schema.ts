import { z } from "zod";
import { Focus, Level, PoolCourse } from "@/generated/prisma/enums";
import { parseInterval } from "./time";

export const STROKES = ["FREE", "BACK", "BREAST", "FLY", "IM"] as const;
export type Stroke = (typeof STROKES)[number];

export const EQUIPMENT = ["FINS", "PADDLES", "PULL_BUOY", "SNORKEL", "KICKBOARD"] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const TARGET_MODES = ["distance", "time"] as const;

// Treat empty form fields as "not provided" rather than coercing "" to 0.
const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

/** What the user asks the generator for. Parsed straight from the form's FormData. */
export const generatorInputSchema = z
  .object({
    pool: z.enum(PoolCourse, { error: "Pick a pool" }),
    targetMode: z.enum(TARGET_MODES),
    totalDistance: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: "Enter a distance" })
        .int()
        .min(500, "At least 500")
        .max(12000, "At most 12,000")
        .multipleOf(25, "Use a multiple of 25")
        .optional(),
    ),
    durationMinutes: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: "Enter a duration" })
        .int()
        .min(15, "At least 15 minutes")
        .max(180, "At most 3 hours")
        .optional(),
    ),
    level: z.enum(Level, { error: "Pick a level" }),
    focus: z.enum(Focus, { error: "Pick a focus" }),
    strokes: z.array(z.enum(STROKES)).min(1, "Pick at least one stroke"),
    equipment: z.array(z.enum(EQUIPMENT)),
    baseInterval: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .optional()
        .transform((text, ctx) => {
          if (text === undefined) return null;
          const seconds = parseInterval(text);
          if (seconds === null || seconds < 50 || seconds > 240) {
            ctx.addIssue({ code: "custom", message: "Use m:ss between :50 and 4:00" });
            return z.NEVER;
          }
          return seconds;
        }),
    ),
  })
  .superRefine((input, ctx) => {
    if (input.targetMode === "distance" && input.totalDistance === undefined) {
      ctx.addIssue({ code: "custom", path: ["totalDistance"], message: "Enter a distance" });
    }
    if (input.targetMode === "time" && input.durationMinutes === undefined) {
      ctx.addIssue({ code: "custom", path: ["durationMinutes"], message: "Enter a duration" });
    }
  });

export type GeneratorInput = z.infer<typeof generatorInputSchema>;
export type GeneratorField = keyof z.input<typeof generatorInputSchema>;

// ---------------------------------------------------------------------------
// Workout content: what gets stored in Workout.content.
// A workout is a list of sections (warm-up, main set...), each made of groups
// that repeat `rounds` times, each group made of lines like "4x100 free @ 1:20".
// ---------------------------------------------------------------------------

export const SECTION_KINDS = ["WARMUP", "PRESET", "MAIN", "KICK", "PULL", "DRILL", "COOLDOWN"] as const;
export const LINE_STROKES = [...STROKES, "CHOICE"] as const;
export const LINE_TYPES = ["SWIM", "KICK", "PULL", "DRILL"] as const;

/** Send-off per lane in seconds. Single-lane workouts only use A. */
export const laneIntervalsSchema = z.object({
  A: z.number().int().positive(),
  B: z.number().int().positive().optional(),
  C: z.number().int().positive().optional(),
});

export const setLineSchema = z.object({
  reps: z.number().int().min(1).max(50),
  distance: z.number().int().min(25).max(3000),
  stroke: z.enum(LINE_STROKES),
  type: z.enum(LINE_TYPES),
  // Either a send-off interval or rest between reps (or neither for continuous swims).
  intervals: laneIntervalsSchema.optional(),
  restSeconds: z.number().int().min(0).max(300).optional(),
  equipment: z.array(z.enum(EQUIPMENT)).default([]),
  // Coaching cue, e.g. "descend 1-4", "build each 50", "race pace".
  note: z.string().max(200).optional(),
});

export const setGroupSchema = z.object({
  rounds: z.number().int().min(1).max(20),
  lines: z.array(setLineSchema).min(1),
  note: z.string().max(200).optional(),
});

export const sectionSchema = z.object({
  id: z.string(),
  kind: z.enum(SECTION_KINDS),
  title: z.string().max(80),
  groups: z.array(setGroupSchema).min(1),
});

export const workoutContentSchema = z.object({
  sections: z.array(sectionSchema).min(1),
});

export type SetLine = z.infer<typeof setLineSchema>;
export type SetGroup = z.infer<typeof setGroupSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type WorkoutContent = z.infer<typeof workoutContentSchema>;
