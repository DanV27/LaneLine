"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PoolCourse } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
import { listSavedSets, type LibrarySet } from "@/lib/data";
import { db } from "@/lib/db";
import { sectionSchema } from "@/lib/workout/schema";
import { sectionDistance } from "@/lib/workout/totals";

const saveSetSchema = z.object({
  section: sectionSchema,
  pool: z.enum(PoolCourse),
  tags: z.array(z.string()),
});

/** "Threshold, Free , threshold" -> ["threshold", "free"] */
function normalizeTags(tags: string[]): string[] {
  const cleaned = tags.map((tag) => tag.trim().toLowerCase().slice(0, 30)).filter(Boolean);
  return [...new Set(cleaned)].slice(0, 10);
}

export type SaveSetResult = { ok: true } | { ok: false; message: string };

export async function saveSet(input: z.input<typeof saveSetSchema>): Promise<SaveSetResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to use the set library." };

  const parsed = saveSetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "This set couldn't be saved." };

  const { section, pool, tags } = parsed.data;
  await db.savedSet.create({
    data: {
      title: section.title.trim() || "Untitled set",
      kind: section.kind,
      pool,
      totalDistance: sectionDistance(section),
      content: section,
      tags: normalizeTags(tags),
      userId: user.id,
    },
  });
  revalidatePath("/library");
  return { ok: true };
}

/** The signed-in user's library, for the "add from library" picker. */
export async function getLibrary(): Promise<LibrarySet[]> {
  const user = await getCurrentUser();
  return user ? listSavedSets(user.id) : [];
}

export async function deleteSet(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.savedSet.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/library");
}
