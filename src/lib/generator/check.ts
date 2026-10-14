import type { PoolCourse } from "@/generated/prisma/enums";
import { fastestPacePer100 } from "@/lib/workout/pace";
import type { WorkoutContent } from "@/lib/workout/schema";
import { formatInterval } from "@/lib/workout/time";
import { estimateSeconds, workoutDistance } from "@/lib/workout/totals";

export type Target = { distance: number } | { seconds: number };

export type CheckContext = {
  pool: PoolCourse;
  target: Target;
  basePace: number;
};

export const poolLength = (pool: PoolCourse) => (pool === "LCM" ? 50 : 25);

/** How far the estimated time may drift from the requested duration. Distance must match exactly. */
export const timeTolerance = (seconds: number) => Math.round(seconds * 0.1);

/**
 * Checks a drafted workout the way a coach would: does it add up, does every
 * swim fit the pool, and can the swimmer actually make the send-offs?
 * Returns human-readable problems; empty means it passed.
 */
export function checkWorkout(content: WorkoutContent, context: CheckContext): string[] {
  const problems: string[] = [];
  const length = poolLength(context.pool);

  content.sections.forEach((section) => {
    section.groups.forEach((group) => {
      group.lines.forEach((line) => {
        const where = `"${section.title}"`;

        if (line.distance % length !== 0) {
          problems.push(`${where}: ${line.distance} isn't a whole number of ${length}-length laps.`);
        }

        if (line.intervals) {
          const pacePer100 = (line.intervals.A / line.distance) * 100;
          const fastest = fastestPacePer100(line, context.basePace);
          // Allow a little faster than base for short sprint reps with built-in rest.
          if (pacePer100 < fastest * 0.92) {
            problems.push(
              `${where}: ${line.reps}x${line.distance} ${line.stroke.toLowerCase()} ${line.type.toLowerCase()} ` +
                `@ ${formatInterval(line.intervals.A)} is ${formatInterval(Math.round(pacePer100))}/100, ` +
                `faster than this swimmer can hold (about ${formatInterval(Math.round(fastest))}/100 or slower).`,
            );
          }
        }
      });
    });
  });

  if ("distance" in context.target) {
    const total = workoutDistance(content);
    const goal = context.target.distance;
    if (total !== goal) {
      problems.push(`Sections add up to ${total}, but the workout should total ${goal}.`);
    }
  } else {
    const estimate = estimateSeconds(content, context.basePace);
    const goal = context.target.seconds;
    if (Math.abs(estimate - goal) > timeTolerance(goal)) {
      problems.push(
        `Estimated time is ${Math.round(estimate / 60)} minutes, but the workout should take about ${Math.round(goal / 60)}.`,
      );
    }
  }

  return problems;
}
