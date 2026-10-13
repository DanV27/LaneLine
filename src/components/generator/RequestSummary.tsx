import {
  EQUIPMENT_OPTIONS,
  FOCUS_OPTIONS,
  LEVEL_OPTIONS,
  STROKE_OPTIONS,
  labelFor,
} from "@/lib/workout/options";
import type { GeneratorInput } from "@/lib/workout/schema";
import { formatInterval } from "@/lib/workout/time";

/** Shows the validated request. Replaced by the rendered workout once the generator lands (step 2). */
export function RequestSummary({ input }: { input: GeneratorInput }) {
  const unit = input.pool === "SCY" ? "yds" : "m";
  const length =
    input.targetMode === "distance"
      ? `${input.totalDistance?.toLocaleString()} ${unit}`
      : `${input.durationMinutes} minutes`;

  const rows: [string, string][] = [
    ["Pool", input.pool],
    ["Length", length],
    ["Level", labelFor(LEVEL_OPTIONS, input.level)],
    ["Focus", labelFor(FOCUS_OPTIONS, input.focus)],
    ["Strokes", input.strokes.map((stroke) => labelFor(STROKE_OPTIONS, stroke)).join(", ")],
    ["Equipment", input.equipment.map((item) => labelFor(EQUIPMENT_OPTIONS, item)).join(", ") || "None"],
    ["Base interval", input.baseInterval ? `${formatInterval(input.baseInterval)} / 100` : "Not set"],
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Request ready</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">
        {length} · {labelFor(FOCUS_OPTIONS, input.focus)}
      </h2>
      <dl className="mt-5 divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2.5 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        Workout generation is wired up in the next step.
      </p>
    </div>
  );
}
