import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { DEFAULT_BASE_BY_LEVEL } from "@/lib/workout/pace";
import {
  sectionSchema,
  workoutContentSchema,
  type GeneratorInput,
  type Section,
  type Target,
  type WorkoutContent,
  type WorkoutContext,
} from "@/lib/workout/schema";
import { sectionDistance } from "@/lib/workout/totals";
import { checkWorkout } from "./check";
import { draftSectionSchema, draftSectionToContent, draftToContent, workoutDraftSchema } from "./draft";
import { describeRequest, repairRequest, rerollRequest, SYSTEM_PROMPT } from "./prompt";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
// Ask Claude to fix a draft this many times before returning it as-is.
const MAX_REPAIRS = 2;

export type GeneratedWorkout = {
  title: string;
  content: WorkoutContent;
  context: WorkoutContext;
  target: Target;
};

export class GenerationError extends Error {}

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new GenerationError("No Anthropic API key is set. Add ANTHROPIC_API_KEY to .env and restart the server.");
  }
  return (client ??= new Anthropic());
}

/** A converted draft (or null if it didn't fit the schema) plus the checks it failed. */
type Attempt<T> = { value: T | null; problems: string[] };

/**
 * Asks Claude for a draft matching `schema`, converts and checks it, and sends
 * failed checks back for repair. Returns the last usable draft; any problems
 * left over are recomputed and shown live by the editor.
 */
async function draftWithRepairs<D, T>(prompt: string, schema: z.ZodType<D>, convert: (draft: D) => Attempt<T>): Promise<T> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
  let best: T | null = null;

  for (let attempt = 0; attempt <= MAX_REPAIRS; attempt++) {
    const response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages,
      output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
      // On a safety decline, let the API retry on a fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    if (response.stop_reason === "refusal") {
      throw new GenerationError("The generator declined this request. Try different settings.");
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      throw new GenerationError("The generator returned an incomplete workout. Please try again.");
    }

    const { value, problems } = convert(response.parsed_output as D);
    if (value !== null) best = value;
    if (value !== null && problems.length === 0) break;

    // Append-only: keep Claude's full reply (including thinking) and ask for a fix.
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: repairRequest(problems) });
  }

  if (best === null) throw new GenerationError("The generator couldn't produce a valid workout. Please try again.");
  return best;
}

const issuesToProblems = (error: z.ZodError) => error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);

export async function generateWorkout(input: GeneratorInput): Promise<GeneratedWorkout> {
  const context: WorkoutContext = {
    pool: input.pool,
    level: input.level,
    focus: input.focus,
    strokes: input.strokes,
    equipment: input.equipment,
    basePace: input.baseInterval ?? DEFAULT_BASE_BY_LEVEL[input.level],
    basePaceGiven: input.baseInterval !== null,
  };
  const target: Target =
    input.targetMode === "distance" ? { distance: input.totalDistance! } : { seconds: input.durationMinutes! * 60 };

  const draft = await draftWithRepairs(describeRequest(context, target), workoutDraftSchema, (draft) => {
    const parsed = workoutContentSchema.safeParse(draftToContent(draft));
    if (!parsed.success) return { value: null, problems: issuesToProblems(parsed.error) };
    return {
      value: { title: draft.title, content: parsed.data },
      problems: checkWorkout(parsed.data, { pool: context.pool, target, basePace: context.basePace }),
    };
  });

  return { ...draft, context, target };
}

/** Rewrites one section with the same distance, keeping the rest of the workout as context. */
export async function rerollSection(context: WorkoutContext, content: WorkoutContent, sectionId: string): Promise<Section> {
  const current = content.sections.find((section) => section.id === sectionId);
  if (!current) throw new GenerationError("That section no longer exists.");
  const distance = sectionDistance(current);

  return draftWithRepairs(rerollRequest(context, content, current), draftSectionSchema, (draft) => {
    const parsed = sectionSchema.safeParse({ ...draftSectionToContent(draft, current.id), kind: current.kind });
    if (!parsed.success) return { value: null, problems: issuesToProblems(parsed.error) };
    // Only check the new section, so edits the user made elsewhere don't get blamed on it.
    const problems = checkWorkout(
      { sections: [parsed.data] },
      { pool: context.pool, target: { distance }, basePace: context.basePace },
    ).map((problem) => problem.replace("the workout should total", "this section should total"));
    return { value: parsed.data, problems };
  });
}
