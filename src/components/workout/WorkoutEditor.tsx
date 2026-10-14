"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { rerollSection } from "@/app/actions";
import { saveWorkout } from "@/app/workouts/actions";
import { authClient } from "@/lib/auth-client";
import { checkWorkout } from "@/lib/generator/check";
import type { GeneratedWorkout } from "@/lib/generator/generate";
import { formatDuration } from "@/lib/workout/format";
import { FOCUS_OPTIONS, LEVEL_OPTIONS, labelFor } from "@/lib/workout/options";
import { stashPendingWorkout } from "@/lib/pending-workout";
import type { Section } from "@/lib/workout/schema";
import { estimateSeconds, sectionDistance, workoutDistance } from "@/lib/workout/totals";
import { smallInputClass } from "./inputs";
import { LibraryPicker } from "./LibraryPicker";
import { SaveToLibrary } from "./SaveToLibrary";
import { blankLine, SectionEditor } from "./SectionEditor";
import { SectionView } from "./SectionView";

type Props = {
  workout: GeneratedWorkout;
  /** Known on pages that already checked the session; read from the browser session otherwise. */
  signedIn?: boolean;
  /** Set when editing a workout that's already saved. */
  savedId?: string;
  /** Lets the page widen the layout while editing; managed internally when omitted. */
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
};

export function WorkoutEditor({ workout, savedId: initialSavedId, ...props }: Props) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const signedIn = props.signedIn ?? Boolean(session);
  const { context, target } = workout;
  const [title, setTitle] = useState(workout.title);
  const [content, setContent] = useState(workout.content);
  const [localEditing, setLocalEditing] = useState(false);
  const editing = props.editing ?? localEditing;
  const setEditing = props.onEditingChange ?? setLocalEditing;

  const [savedId, setSavedId] = useState(initialSavedId);
  // What was last saved, to tell whether there are unsaved changes.
  const [savedVersion, setSavedVersion] = useState(initialSavedId ? { title: workout.title, content: workout.content } : null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [libraryFormFor, setLibraryFormFor] = useState<string | null>(null);
  const [rerollingId, setRerollingId] = useState<string | null>(null);
  const [rerollError, setRerollError] = useState<{ sectionId: string; message: string } | null>(null);

  const unit = context.pool === "SCY" ? "yds" : "m";
  const total = workoutDistance(content);
  const seconds = estimateSeconds(content, context.basePace);
  // The same checks the generator runs, recomputed live as the workout is edited.
  const problems = checkWorkout(content, { pool: context.pool, target, basePace: context.basePace });
  const offTarget = "distance" in target && total !== target.distance;
  const changed = content !== workout.content || title !== workout.title;
  const dirty = !savedVersion || savedVersion.title !== title || savedVersion.content !== content;

  async function save() {
    if (!signedIn) {
      // Keep the workout (with edits) through sign-in; /workouts/import saves it afterwards.
      stashPendingWorkout({ title, content, context, target });
      router.push("/signin?next=/workouts/import");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const result = await saveWorkout({ id: savedId, title, content, context, target });
    if (result.ok) {
      setSavedId(result.id);
      setSavedVersion({ title, content });
    } else {
      setSaveError(result.message);
    }
    setSaving(false);
  }

  function addSection(section: Section) {
    setContent((current) => ({ sections: [...current.sections, section] }));
  }

  function updateSection(next: Section) {
    setContent((current) => ({
      sections: current.sections
        .map((section) => (section.id === next.id ? next : section))
        .filter((section) => section.groups.length > 0),
    }));
  }

  async function reroll(sectionId: string) {
    setRerollingId(sectionId);
    setRerollError(null);
    const result = await rerollSection(context, content, sectionId);
    if (result.ok) updateSection(result.section);
    else setRerollError({ sectionId, message: result.message });
    setRerollingId(null);
  }

  function reset() {
    setTitle(workout.title);
    setContent(workout.content);
    setRerollError(null);
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              {labelFor(FOCUS_OPTIONS, context.focus)} · {labelFor(LEVEL_OPTIONS, context.level)} · {context.pool}
            </p>
            {editing ? (
              <input
                aria-label="Workout title"
                value={title}
                maxLength={80}
                onChange={(event) => setTitle(event.target.value)}
                className={`${smallInputClass} mt-1 w-full text-xl font-semibold`}
              />
            ) : (
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">{title || "Untitled workout"}</h2>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {changed && (
              <button
                type="button"
                onClick={reset}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                editing ? "bg-sky-600 text-white hover:bg-sky-700" : "border border-slate-300 text-slate-700 hover:border-sky-400"
              }`}
            >
              {editing ? "Done" : "Edit"}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || (signedIn && !dirty)}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-500"
            >
              {!signedIn ? "Sign in to save" : saving ? "Saving…" : !dirty ? "Saved ✓" : savedId ? "Save changes" : "Save"}
            </button>
          </div>
        </div>
        {saveError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {saveError}
          </p>
        )}
        {savedId && !initialSavedId && (
          <p className="mt-2 text-sm text-slate-500">
            Saved to{" "}
            <Link href={`/workouts/${savedId}`} className="font-medium text-sky-700 hover:underline">
              My workouts
            </Link>
            .
          </p>
        )}
        <dl className="mt-4 flex gap-8 text-sm">
          <div>
            <dt className="text-slate-500">Total</dt>
            <dd className="text-lg font-semibold tabular-nums text-slate-900">
              {total.toLocaleString()} {unit}
              {offTarget && (
                <span className="ml-1.5 text-sm font-medium text-amber-700">
                  of {target.distance.toLocaleString()}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Est. time</dt>
            <dd className="text-lg font-semibold tabular-nums text-slate-900">{formatDuration(seconds)}</dd>
          </div>
        </dl>
      </header>

      {problems.length > 0 && (
        <div role="status" className="mx-6 mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">A few checks don&apos;t pass</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {content.sections.map((section) => {
          const busy = rerollingId === section.id;
          return (
            <section key={section.id} className="p-6" aria-busy={busy}>
              <div className="mb-3 flex items-center gap-3">
                {editing ? (
                  <input
                    aria-label="Section title"
                    value={section.title}
                    maxLength={80}
                    onChange={(event) => updateSection({ ...section, title: event.target.value })}
                    className={`${smallInputClass} flex-1 font-semibold`}
                  />
                ) : (
                  <h3 className="flex-1 font-semibold text-slate-900">{section.title}</h3>
                )}
                <span className="text-sm tabular-nums text-slate-500">{sectionDistance(section).toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => reroll(section.id)}
                  disabled={rerollingId !== null}
                  title="Rewrite this section with the same distance"
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:border-sky-400 hover:text-sky-700 disabled:opacity-50"
                >
                  {busy ? "Re-rolling…" : "↻ Re-roll"}
                </button>
                {signedIn && (
                  <button
                    type="button"
                    onClick={() => setLibraryFormFor(libraryFormFor === section.id ? null : section.id)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:border-sky-400 hover:text-sky-700"
                  >
                    Save to library
                  </button>
                )}
                {editing && (
                  <button
                    type="button"
                    onClick={() => updateSection({ ...section, groups: [] })}
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>

              {libraryFormFor === section.id && (
                <SaveToLibrary section={section} pool={context.pool} onClose={() => setLibraryFormFor(null)} />
              )}

              {rerollError?.sectionId === section.id && (
                <p role="alert" className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
                  {rerollError.message}
                </p>
              )}

              <div className={busy ? "pointer-events-none animate-pulse opacity-50" : undefined}>
                {editing ? (
                  <SectionEditor section={section} basePace={context.basePace} onChange={updateSection} />
                ) : (
                  <SectionView section={section} />
                )}
              </div>
            </section>
          );
        })}
      </div>

      {editing && (
        <div className="flex flex-wrap items-start gap-6 border-t border-slate-100 p-6">
          <button
            type="button"
            onClick={() =>
              addSection({
                id: crypto.randomUUID(),
                kind: "MAIN",
                title: "New section",
                groups: [{ rounds: 1, lines: [blankLine(context.basePace)] }],
              })
            }
            className="text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            + Add section
          </button>
          {signedIn && (
            <div className="min-w-72 flex-1">
              <LibraryPicker onPick={addSection} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
