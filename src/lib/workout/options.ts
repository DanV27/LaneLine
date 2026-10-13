import type { Focus, Level, PoolCourse } from "@/generated/prisma/enums";
import type { Equipment, Stroke } from "./schema";

type Option<T extends string> = { value: T; label: string; hint?: string };

export const POOL_OPTIONS: Option<PoolCourse>[] = [
  { value: "SCY", label: "SCY", hint: "25 yards" },
  { value: "SCM", label: "SCM", hint: "25 meters" },
  { value: "LCM", label: "LCM", hint: "50 meters" },
];

export const LEVEL_OPTIONS: Option<Level>[] = [
  { value: "BEGINNER", label: "Beginner", hint: "Learning to train" },
  { value: "MASTERS", label: "Masters / fitness", hint: "Adult training" },
  { value: "AGE_GROUP", label: "Age group", hint: "Club swimmers, 10–14" },
  { value: "HIGH_SCHOOL", label: "High school", hint: "Varsity and senior club" },
  { value: "COLLEGE_ELITE", label: "College / elite", hint: "High-volume training" },
];

export const FOCUS_OPTIONS: Option<Focus>[] = [
  { value: "AEROBIC", label: "Aerobic", hint: "Steady base work" },
  { value: "THRESHOLD", label: "Threshold", hint: "Hold a hard, sustainable pace" },
  { value: "SPRINT", label: "Sprint", hint: "Short, fast, lots of rest" },
  { value: "IM", label: "IM", hint: "All four strokes" },
  { value: "KICK", label: "Kick", hint: "Leg-focused" },
  { value: "PULL", label: "Pull", hint: "Upper-body strength" },
  { value: "TECHNIQUE", label: "Technique", hint: "Drills and form" },
  { value: "TAPER", label: "Taper", hint: "Low volume, race-sharp" },
  { value: "RECOVERY", label: "Recovery", hint: "Easy, loosen up" },
];

export const STROKE_OPTIONS: Option<Stroke>[] = [
  { value: "FREE", label: "Free" },
  { value: "BACK", label: "Back" },
  { value: "BREAST", label: "Breast" },
  { value: "FLY", label: "Fly" },
  { value: "IM", label: "IM" },
];

export const EQUIPMENT_OPTIONS: Option<Equipment>[] = [
  { value: "FINS", label: "Fins" },
  { value: "PADDLES", label: "Paddles" },
  { value: "PULL_BUOY", label: "Pull buoy" },
  { value: "SNORKEL", label: "Snorkel" },
  { value: "KICKBOARD", label: "Kickboard" },
];

export function labelFor<T extends string>(options: Option<T>[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
