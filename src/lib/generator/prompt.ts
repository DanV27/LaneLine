import {
  EQUIPMENT_OPTIONS,
  FOCUS_OPTIONS,
  LEVEL_OPTIONS,
  STROKE_OPTIONS,
  labelFor,
} from "@/lib/workout/options";
import { workoutToText } from "@/lib/workout/format";
import type { Section, Target, WorkoutContent, WorkoutContext } from "@/lib/workout/schema";
import { formatInterval } from "@/lib/workout/time";
import { sectionDistance } from "@/lib/workout/totals";
import { poolLength } from "./check";

export const SYSTEM_PROMPT = `You are an experienced swim coach writing a single practice for a swimmer or team.

Write the workout the way a good coach would put it on the whiteboard: a warm-up, often a pre-set or kick/drill section, a main set that delivers the requested focus, and a cool-down. Use familiar set structures (descending sets, pyramids, broken swims, rounds) and give coaching cues in the line notes when they add something.

Rules the workout must satisfy (it is checked automatically):
- Every distance is a whole number of pool lengths.
- The sections add up to the requested total distance exactly, or fill the requested time.
- Send-offs (intervalSeconds) are realistic for the swimmer's base pace. The base pace is their sustainable send-off per 100 free; kick, drill and other strokes are slower, and aerobic or easy work should leave rest on top of swim time. Use restSeconds instead of a send-off for sprint or quality work when rest matters more than the clock, and leave both null for continuous easy swimming.
- Only use equipment the swimmer has. Kick sets without a kickboard are fine (streamline or on the back).
- Use the strokes the swimmer asked for in the main set; warm-up and cool-down can be choice or free.`;

export const unitFor = (pool: WorkoutContext["pool"]) => (pool === "SCY" ? "yards" : "meters");

export function describeRequest(context: WorkoutContext, target: Target): string {
  const unit = unitFor(context.pool);
  const length =
    "distance" in target
      ? `exactly ${target.distance} ${unit}`
      : `about ${Math.round(target.seconds / 60)} minutes of swimming (pick a total distance that fits)`;
  const equipment = context.equipment.map((item) => labelFor(EQUIPMENT_OPTIONS, item)).join(", ") || "none";
  const paceSource = context.basePaceGiven ? "given by the swimmer" : "typical for this level; the swimmer didn't set one";

  return [
    `Pool: ${context.pool} (${poolLength(context.pool)} ${unit} per length)`,
    `Length: ${length}`,
    `Level: ${labelFor(LEVEL_OPTIONS, context.level)}`,
    `Focus: ${labelFor(FOCUS_OPTIONS, context.focus)}`,
    `Strokes: ${context.strokes.map((stroke) => labelFor(STROKE_OPTIONS, stroke)).join(", ")}`,
    `Equipment available: ${equipment}`,
    `Base pace: ${formatInterval(context.basePace)} per 100 free (${paceSource})`,
  ].join("\n");
}

export function rerollRequest(context: WorkoutContext, content: WorkoutContent, section: Section): string {
  const distance = sectionDistance(section);
  return [
    describeRequest(context, { distance: content.sections.reduce((sum, s) => sum + sectionDistance(s), 0) }),
    "",
    "Current workout:",
    workoutToText(content),
    "",
    `Rewrite only the "${section.title}" section (${section.kind}) with a fresh take that still fits the workout around it. ` +
      `It must total exactly ${distance} ${unitFor(context.pool)} so the workout total doesn't change. Return just that section.`,
  ].join("\n");
}

export function repairRequest(problems: string[]): string {
  return `The workout failed these checks:\n${problems.map((problem) => `- ${problem}`).join("\n")}\n\nReturn the full corrected workout. Keep everything that already works.`;
}
