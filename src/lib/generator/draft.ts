import { z } from "zod";
import { EQUIPMENT, LINE_STROKES, LINE_TYPES, SECTION_KINDS, type WorkoutContent } from "@/lib/workout/schema";

// The shape Claude fills in via structured outputs. Kept flat and constraint-free
// (structured outputs ignore min/max); the real rules live in workoutContentSchema
// and checkWorkout, which run on the converted result.

const draftLineSchema = z.object({
  reps: z.number().int(),
  distance: z.number().int(),
  stroke: z.enum(LINE_STROKES),
  type: z.enum(LINE_TYPES),
  intervalSeconds: z.number().int().nullable().describe("Send-off per rep in seconds, or null"),
  restSeconds: z.number().int().nullable().describe("Rest between reps in seconds when there is no send-off, or null"),
  equipment: z.array(z.enum(EQUIPMENT)),
  note: z.string().nullable().describe("Short coaching cue, e.g. 'descend 1-4', or null"),
});

const draftGroupSchema = z.object({
  rounds: z.number().int().describe("How many times to repeat the lines; 1 for no repeat"),
  lines: z.array(draftLineSchema),
  note: z.string().nullable(),
});

const draftSectionSchema = z.object({
  kind: z.enum(SECTION_KINDS),
  title: z.string(),
  groups: z.array(draftGroupSchema),
});

export const workoutDraftSchema = z.object({
  title: z.string().describe("Short, specific workout name, without distances or times"),
  sections: z.array(draftSectionSchema),
});

export type WorkoutDraft = z.infer<typeof workoutDraftSchema>;

/** Converts Claude's draft into stored workout content (nulls dropped, section ids assigned). */
export function draftToContent(draft: WorkoutDraft): WorkoutContent {
  return {
    sections: draft.sections.map((section, index) => ({
      id: `${section.kind.toLowerCase()}-${index + 1}`,
      kind: section.kind,
      title: section.title,
      groups: section.groups.map((group) => ({
        rounds: group.rounds,
        note: group.note ?? undefined,
        lines: group.lines.map((line) => ({
          reps: line.reps,
          distance: line.distance,
          stroke: line.stroke,
          type: line.type,
          intervals: line.intervalSeconds ? { A: line.intervalSeconds } : undefined,
          restSeconds: line.intervalSeconds ? undefined : (line.restSeconds ?? undefined),
          equipment: line.equipment,
          note: line.note ?? undefined,
        })),
      })),
    })),
  };
}
