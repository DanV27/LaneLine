import type { Level } from "@/generated/prisma/enums";
import type { SetLine } from "./schema";

/** Fallback base pace (seconds per 100 free) when the swimmer didn't give one. */
export const DEFAULT_BASE_BY_LEVEL: Record<Level, number> = {
  BEGINNER: 135,
  MASTERS: 105,
  AGE_GROUP: 95,
  HIGH_SCHOOL: 80,
  COLLEGE_ELITE: 70,
};

/** How much slower than free swim each stroke is, per 100. */
const STROKE_FACTOR: Record<SetLine["stroke"], number> = {
  FREE: 1,
  CHOICE: 1,
  BACK: 1.08,
  FLY: 1.1,
  IM: 1.12,
  BREAST: 1.2,
};

/** Extra slowdown for kick / drill; pull is about swim pace. */
const TYPE_FACTOR: Record<SetLine["type"], number> = {
  SWIM: 1,
  PULL: 1,
  DRILL: 1.15,
  KICK: 1.35,
};

/** Fastest realistic seconds per 100 for this line, at the swimmer's best sustainable effort. */
export function fastestPacePer100(line: Pick<SetLine, "stroke" | "type">, basePace: number): number {
  return basePace * STROKE_FACTOR[line.stroke] * TYPE_FACTOR[line.type];
}
