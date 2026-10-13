import type { GeneratedWorkout } from "@/lib/generator/generate";
import { FOCUS_OPTIONS, LEVEL_OPTIONS, labelFor } from "@/lib/workout/options";
import { formatDuration, formatLine } from "@/lib/workout/format";
import type { GeneratorInput } from "@/lib/workout/schema";
import { groupDistance, sectionDistance } from "@/lib/workout/totals";

export function WorkoutView({ input, workout }: { input: GeneratorInput; workout: GeneratedWorkout }) {
  const unit = input.pool === "SCY" ? "yds" : "m";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
          {labelFor(FOCUS_OPTIONS, input.focus)} · {labelFor(LEVEL_OPTIONS, input.level)} · {input.pool}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">{workout.title}</h2>
        <dl className="mt-4 flex gap-8 text-sm">
          <div>
            <dt className="text-slate-500">Total</dt>
            <dd className="text-lg font-semibold tabular-nums text-slate-900">
              {workout.totalDistance.toLocaleString()} {unit}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Est. time</dt>
            <dd className="text-lg font-semibold tabular-nums text-slate-900">
              {formatDuration(workout.estimatedSeconds)}
            </dd>
          </div>
        </dl>
      </header>

      {workout.warnings.length > 0 && (
        <div className="mx-6 mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Heads up: a few checks didn&apos;t pass</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {workout.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {workout.content.sections.map((section) => (
          <section key={section.id} className="p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold text-slate-900">{section.title}</h3>
              <span className="text-sm tabular-nums text-slate-500">{sectionDistance(section).toLocaleString()}</span>
            </div>
            <div className="mt-3 space-y-3 font-mono text-[15px] text-slate-800">
              {section.groups.map((group, groupIndex) => {
                const repeated = group.rounds > 1;
                return (
                  <div key={groupIndex}>
                    {repeated && (
                      <p className="font-semibold">
                        {group.rounds} rounds
                        <span className="font-normal text-slate-500"> ({groupDistance(group).toLocaleString()})</span>
                        {group.note && <span className="font-sans text-sm font-normal text-slate-500"> · {group.note}</span>}
                      </p>
                    )}
                    <ul className={repeated ? "mt-1 space-y-1 border-l-2 border-sky-200 pl-4" : "space-y-1"}>
                      {group.lines.map((line, lineIndex) => (
                        <li key={lineIndex}>
                          {formatLine(line)}
                          {line.note && <span className="font-sans text-sm text-slate-500"> · {line.note}</span>}
                        </li>
                      ))}
                    </ul>
                    {!repeated && group.note && <p className="mt-1 font-sans text-sm text-slate-500">{group.note}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
