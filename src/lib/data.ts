import "server-only";

import type { PoolCourse } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { GeneratedWorkout } from "@/lib/generator/generate";
import { sectionSchema, workoutContentSchema, workoutParamsSchema, type Section } from "@/lib/workout/schema";

export type SavedWorkout = GeneratedWorkout & { id: string; updatedAt: Date };

/** A user's workout, parsed back into editor shape. Null if missing, not theirs, or unreadable. */
export async function getWorkout(id: string, userId: string): Promise<SavedWorkout | null> {
  const row = await db.workout.findFirst({ where: { id, userId } });
  if (!row) return null;

  const content = workoutContentSchema.safeParse(row.content);
  const params = workoutParamsSchema.safeParse(row.params);
  if (!content.success || !params.success) return null;

  return { id: row.id, updatedAt: row.updatedAt, title: row.title, content: content.data, ...params.data };
}

export async function listWorkouts(userId: string, search?: string) {
  return db.workout.findMany({
    where: { userId, ...(search ? { title: { contains: search, mode: "insensitive" } } : {}) },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      pool: true,
      level: true,
      focus: true,
      totalDistance: true,
      estimatedSeconds: true,
      updatedAt: true,
    },
  });
}

export type LibrarySet = {
  id: string;
  title: string;
  pool: PoolCourse;
  totalDistance: number;
  tags: string[];
  section: Section;
};

export async function listSavedSets(userId: string, filter: { search?: string; tag?: string } = {}): Promise<LibrarySet[]> {
  const rows = await db.savedSet.findMany({
    where: {
      userId,
      ...(filter.search ? { title: { contains: filter.search, mode: "insensitive" } } : {}),
      ...(filter.tag ? { tags: { has: filter.tag } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.flatMap((row) => {
    const section = sectionSchema.safeParse(row.content);
    if (!section.success) return [];
    return [{ id: row.id, title: row.title, pool: row.pool, totalDistance: row.totalDistance, tags: row.tags, section: section.data }];
  });
}

export async function listTags(userId: string): Promise<string[]> {
  const rows = await db.savedSet.findMany({ where: { userId }, select: { tags: true } });
  return [...new Set(rows.flatMap((row) => row.tags))].sort();
}
