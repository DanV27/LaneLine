"use client";

import { useActionState, useState } from "react";
import { generateWorkout, type GenerateState } from "@/app/actions";
import { WorkoutEditor } from "@/components/workout/WorkoutEditor";
import type { Focus, Level, PoolCourse } from "@/generated/prisma/enums";
import {
  EQUIPMENT_OPTIONS,
  FOCUS_OPTIONS,
  LEVEL_OPTIONS,
  POOL_OPTIONS,
  STROKE_OPTIONS,
} from "@/lib/workout/options";
import type { Equipment, Stroke } from "@/lib/workout/schema";
import { ChoiceGroup, Field, inputClass } from "./fields";

const initialState: GenerateState = { status: "idle" };

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function GeneratorForm() {
  const [state, formAction, pending] = useActionState(generateWorkout, initialState);

  // Controlled inputs so values survive React's automatic form reset after the action runs.
  const [pool, setPool] = useState<PoolCourse>("SCY");
  const [targetMode, setTargetMode] = useState<"distance" | "time">("distance");
  const [totalDistance, setTotalDistance] = useState("4000");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [level, setLevel] = useState<Level>("HIGH_SCHOOL");
  const [focus, setFocus] = useState<Focus>("AEROBIC");
  const [strokes, setStrokes] = useState<Stroke[]>(["FREE"]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [baseInterval, setBaseInterval] = useState("1:20");

  // Editing hides the form so the workout gets the full width.
  const [editing, setEditing] = useState(false);
  const showEditor = editing && state.status === "ready" && !pending;

  const errors = state.status === "invalid" ? state.fieldErrors : {};
  const unit = pool === "SCY" ? "yards" : "meters";

  return (
    <div className={showEditor ? "mx-auto max-w-4xl" : "grid gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]"}>
      <form
        action={formAction}
        onSubmit={() => setEditing(false)}
        hidden={showEditor}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <Field label="Pool" error={errors.pool?.[0]}>
          <ChoiceGroup
            name="pool"
            type="radio"
            options={POOL_OPTIONS}
            selected={[pool]}
            onToggle={(value) => setPool(value as PoolCourse)}
            columns="grid grid-cols-3 gap-2"
          />
        </Field>

        <Field label="Workout length" error={errors.totalDistance?.[0] ?? errors.durationMinutes?.[0]}>
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-slate-300 p-0.5 text-sm">
              {(["distance", "time"] as const).map((mode) => (
                <label
                  key={mode}
                  className={`cursor-pointer rounded-md px-3 py-1.5 capitalize ${
                    targetMode === mode ? "bg-slate-900 text-white" : "text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetMode"
                    value={mode}
                    checked={targetMode === mode}
                    onChange={() => setTargetMode(mode)}
                    className="sr-only"
                  />
                  {mode}
                </label>
              ))}
            </div>
            <div className="relative flex-1">
              {targetMode === "distance" ? (
                <input
                  name="totalDistance"
                  type="number"
                  inputMode="numeric"
                  step={100}
                  value={totalDistance}
                  onChange={(event) => setTotalDistance(event.target.value)}
                  className={`${inputClass} pr-16`}
                  aria-label={`Total distance in ${unit}`}
                />
              ) : (
                <input
                  name="durationMinutes"
                  type="number"
                  inputMode="numeric"
                  step={5}
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  className={`${inputClass} pr-16`}
                  aria-label="Duration in minutes"
                />
              )}
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
                {targetMode === "distance" ? unit : "minutes"}
              </span>
            </div>
          </div>
        </Field>

        <Field label="Level" error={errors.level?.[0]}>
          <select
            name="level"
            value={level}
            onChange={(event) => setLevel(event.target.value as Level)}
            className={inputClass}
          >
            {LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} — {option.hint}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Focus" error={errors.focus?.[0]}>
          <ChoiceGroup
            name="focus"
            type="radio"
            options={FOCUS_OPTIONS}
            selected={[focus]}
            onToggle={(value) => setFocus(value as Focus)}
            columns="grid grid-cols-3 gap-2"
          />
        </Field>

        <Field label="Strokes" hint="Pick one or more" error={errors.strokes?.[0]}>
          <ChoiceGroup
            name="strokes"
            type="checkbox"
            options={STROKE_OPTIONS}
            selected={strokes}
            onToggle={(value) => setStrokes((current) => toggle(current, value as Stroke))}
          />
        </Field>

        <Field label="Equipment" hint="What's on deck" error={errors.equipment?.[0]}>
          <ChoiceGroup
            name="equipment"
            type="checkbox"
            options={EQUIPMENT_OPTIONS}
            selected={equipment}
            onToggle={(value) => setEquipment((current) => toggle(current, value as Equipment))}
          />
        </Field>

        <Field label="Base interval" hint="Sustainable send-off per 100 free" error={errors.baseInterval?.[0]}>
          <input
            name="baseInterval"
            placeholder="1:20"
            aria-label="Base interval per 100 free"
            value={baseInterval}
            onChange={(event) => setBaseInterval(event.target.value)}
            className={inputClass}
          />
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate workout"}
        </button>
      </form>

      <section aria-live="polite" aria-busy={pending}>
        {pending ? (
          <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" aria-hidden />
            <p className="mt-4 font-semibold text-slate-700">Writing your workout…</p>
            <p className="mt-1 text-sm text-slate-500">Drafting the sets and checking the math. This takes up to a minute.</p>
          </div>
        ) : state.status === "ready" ? (
          <WorkoutEditor key={state.id} workout={state.workout} editing={showEditor} onEditingChange={setEditing} />
        ) : state.status === "error" ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            <p className="font-semibold">Couldn&apos;t generate a workout</p>
            <p className="mt-1">{state.message}</p>
          </div>
        ) : (
          <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
            <p className="text-lg font-semibold text-slate-700">Your workout will appear here</p>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Set the pool, length and focus, then generate. You&apos;ll get a warm-up, main set and cool-down with
              intervals matched to your pace.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
