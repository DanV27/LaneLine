import { fastestPacePer100 } from "./pace";
import type { Section, SetGroup, SetLine, WorkoutContent } from "./schema";

export const lineDistance = (line: SetLine) => line.reps * line.distance;

export const groupDistance = (group: SetGroup) =>
  group.rounds * group.lines.reduce((sum, line) => sum + lineDistance(line), 0);

export const sectionDistance = (section: Section) =>
  section.groups.reduce((sum, group) => sum + groupDistance(group), 0);

export const workoutDistance = (content: WorkoutContent) =>
  content.sections.reduce((sum, section) => sum + sectionDistance(section), 0);

// Lines without a send-off are usually easy/continuous swims, so assume a relaxed pace.
const EASY_FACTOR = 1.15;

function lineSeconds(line: SetLine, basePace: number): number {
  if (line.intervals) return line.reps * line.intervals.A;
  const swimSeconds = (line.distance / 100) * fastestPacePer100(line, basePace) * EASY_FACTOR;
  return line.reps * (swimSeconds + (line.restSeconds ?? 0));
}

/** Estimated practice time in seconds, from send-offs where given and the base pace otherwise. */
export function estimateSeconds(content: WorkoutContent, basePace: number): number {
  let total = 0;
  for (const section of content.sections) {
    for (const group of section.groups) {
      total += group.rounds * group.lines.reduce((sum, line) => sum + lineSeconds(line, basePace), 0);
    }
  }
  return Math.round(total);
}
