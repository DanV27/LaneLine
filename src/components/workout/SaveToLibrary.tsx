"use client";

import { useState } from "react";
import { saveSet } from "@/app/library/actions";
import type { PoolCourse } from "@/generated/prisma/enums";
import type { Section } from "@/lib/workout/schema";
import { smallInputClass } from "./inputs";

/** Inline form under a section header: add tags and save the section to the library. */
export function SaveToLibrary({ section, pool, onClose }: { section: Section; pool: PoolCourse; onClose: () => void }) {
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    const result = await saveSet({ section, pool, tags: tags.split(",") });
    if (result.ok) setStatus("saved");
    else {
      setError(result.message);
      setStatus("idle");
    }
  }

  if (status === "saved") {
    return (
      <p role="status" className="mb-3 flex items-center justify-between rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">
        Saved to your library.
        <button type="button" onClick={onClose} className="font-medium hover:underline">
          Close
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={save} className="mb-3 flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-2 ring-1 ring-slate-200">
      <input
        aria-label="Tags"
        autoFocus
        placeholder="Tags, comma separated (e.g. threshold, free)"
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        className={`${smallInputClass} min-w-48 flex-1`}
      />
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-md bg-sky-600 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : "Save to library"}
      </button>
      <button type="button" onClick={onClose} className="px-2 py-1 text-sm text-slate-600 hover:text-slate-900">
        Cancel
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
