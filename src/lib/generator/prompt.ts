import {
  EQUIPMENT_OPTIONS,
  FOCUS_OPTIONS,
  LEVEL_OPTIONS,
  STROKE_OPTIONS,
  labelFor,
} from "@/lib/workout/options";
import type { GeneratorInput } from "@/lib/workout/schema";
import { formatInterval } from "@/lib/workout/time";
import { poolLength, type Target } from "./check";

export const SYSTEM_PROMPT = `You are an experienced swim coach writing a single practice for a swimmer or team.

Write the workout the way a good coach would put it on the whiteboard: a warm-up, often a pre-set or kick/drill section, a main set that delivers the requested focus, and a cool-down. Use familiar set structures (descending sets, pyramids, broken swims, rounds) and give coaching cues in the line notes when they add something.

Rules the workout must satisfy (it is checked automatically):
- Every distance is a whole number of pool lengths.
- The sections add up to the requested total distance exactly, or fill the requested time.
- Send-offs (intervalSeconds) are realistic for the swimmer's base pace. The base pace is their sustainable send-off per 100 free; kick, drill and other strokes are slower, and aerobic or easy work should leave rest on top of swim time. Use restSeconds instead of a send-off for sprint or quality work when rest matters more than the clock, and leave both null for continuous easy swimming.
- Only use equipment the swimmer has. Kick sets without a kickboard are fine (streamline or on the back).
- Use the strokes the swimmer asked for in the main set; warm-up and cool-down can be choice or free.`;

export function describeRequest(input: GeneratorInput, target: Target, basePace: number): string {
  const unit = input.pool === "SCY" ? "yards" : "meters";
  const length =
    "distance" in target
      ? `exactly ${target.distance} ${unit}`
      : `about ${Math.round(target.seconds / 60)} minutes of swimming (pick a total distance that fits)`;
  const equipment = input.equipment.map((item) => labelFor(EQUIPMENT_OPTIONS, item)).join(", ") || "none";
  const paceSource = input.baseInterval ? "given by the swimmer" : "typical for this level; the swimmer didn't set one";

  return [
    `Pool: ${input.pool} (${poolLength(input.pool)} ${unit} per length)`,
    `Length: ${length}`,
    `Level: ${labelFor(LEVEL_OPTIONS, input.level)}`,
    `Focus: ${labelFor(FOCUS_OPTIONS, input.focus)}`,
    `Strokes: ${input.strokes.map((stroke) => labelFor(STROKE_OPTIONS, stroke)).join(", ")}`,
    `Equipment available: ${equipment}`,
    `Base pace: ${formatInterval(basePace)} per 100 free (${paceSource})`,
  ].join("\n");
}

export function repairRequest(problems: string[]): string {
  return `The workout failed these checks:\n${problems.map((problem) => `- ${problem}`).join("\n")}\n\nReturn the full corrected workout. Keep everything that already works.`;
}
