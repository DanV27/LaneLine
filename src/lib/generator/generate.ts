import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { DEFAULT_BASE_BY_LEVEL } from "@/lib/workout/pace";
import { workoutContentSchema, type GeneratorInput, type WorkoutContent } from "@/lib/workout/schema";
import { estimateSeconds, workoutDistance } from "@/lib/workout/totals";
import { checkWorkout, type Target } from "./check";
import { draftToContent, workoutDraftSchema } from "./draft";
import { describeRequest, repairRequest, SYSTEM_PROMPT } from "./prompt";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";
// Ask Claude to fix a draft this many times before returning it with warnings.
const MAX_REPAIRS = 2;

export type GeneratedWorkout = {
  title: string;
  content: WorkoutContent;
  totalDistance: number;
  estimatedSeconds: number;
  /** Checks that still failed after the repair attempts; empty when the workout is clean. */
  warnings: string[];
};

export class GenerationError extends Error {}

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new GenerationError("No Anthropic API key is set. Add ANTHROPIC_API_KEY to .env and restart the server.");
  }
  return (client ??= new Anthropic());
}

export async function generateWorkout(input: GeneratorInput): Promise<GeneratedWorkout> {
  const basePace = input.baseInterval ?? DEFAULT_BASE_BY_LEVEL[input.level];
  const target: Target =
    input.targetMode === "distance" ? { distance: input.totalDistance! } : { seconds: input.durationMinutes! * 60 };

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: describeRequest(input, target, basePace) },
  ];

  let result: { title: string; content: WorkoutContent; problems: string[] } | undefined;

  for (let attempt = 0; attempt <= MAX_REPAIRS; attempt++) {
    const response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages,
      output_config: { effort: "medium", format: betaZodOutputFormat(workoutDraftSchema) },
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

    const parsed = workoutContentSchema.safeParse(draftToContent(response.parsed_output));
    const content = parsed.success ? parsed.data : null;
    const problems = parsed.success
      ? checkWorkout(parsed.data, { pool: input.pool, target, basePace })
      : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);

    if (content) result = { title: response.parsed_output.title, content, problems };
    if (content && problems.length === 0) break;

    // Append-only: keep Claude's full reply (including thinking) and ask for a fix.
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: repairRequest(problems) });
  }

  if (!result) throw new GenerationError("The generator couldn't produce a valid workout. Please try again.");

  return {
    title: result.title,
    content: result.content,
    totalDistance: workoutDistance(result.content),
    estimatedSeconds: estimateSeconds(result.content, basePace),
    warnings: result.problems,
  };
}
