"use client";

import Link from "next/link";
import { useState } from "react";
import { getLibrary } from "@/app/library/actions";
import type { LibrarySet } from "@/lib/data";
import type { Section } from "@/lib/workout/schema";
import { smallInputClass } from "./inputs";

/** Opens the user's set library and inserts a chosen set as a new section. */
export function LibraryPicker({ onPick }: { onPick: (section: Section) => void }) {
  const [sets, setSets] = useState<LibrarySet[] | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  async function toggle() {
    if (!open && sets === null) setSets(await getLibrary());
    setOpen(!open);
  }

  const query = filter.trim().toLowerCase();
  const visible = (sets ?? []).filter(
    (set) => !query || set.title.toLowerCase().includes(query) || set.tags.some((tag) => tag.includes(query)),
  );

  return (
    <div>
      <button type="button" onClick={toggle} className="text-sm font-medium text-sky-700 hover:text-sky-900">
        {open ? "Close library" : "+ Add from library"}
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          {sets === null ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : sets.length === 0 ? (
            <p className="text-sm text-slate-500">
              Your library is empty. Use <strong>Save to library</strong> on any section to add it.
            </p>
          ) : (
            <>
              <input
                aria-label="Filter library"
                placeholder="Filter by title or tag"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className={`${smallInputClass} w-full`}
              />
              <ul className="max-h-72 divide-y divide-slate-200 overflow-y-auto">
                {visible.map((set) => (
                  <li key={set.id} className="flex items-center gap-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{set.title}</p>
                      <p className="text-xs text-slate-500">
                        {set.totalDistance.toLocaleString()} {set.pool}
                        {set.tags.length > 0 && ` · ${set.tags.join(", ")}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onPick({ ...set.section, id: crypto.randomUUID() });
                        setOpen(false);
                      }}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:border-sky-400"
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
              <Link href="/library" className="text-xs text-slate-500 hover:text-slate-800">
                Manage library →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
