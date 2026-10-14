import { formatLine } from "@/lib/workout/format";
import type { Section } from "@/lib/workout/schema";
import { groupDistance } from "@/lib/workout/totals";

/** Read-only swim notation for one section's groups. */
export function SectionView({ section }: { section: Section }) {
  return (
    <div className="space-y-3 font-mono text-[15px] text-slate-800">
      {section.groups.map((group, groupIndex) => {
        const repeated = group.rounds > 1;
        return (
          <div key={groupIndex}>
            {repeated ? (
              <p className="font-semibold">
                {group.rounds} rounds
                <span className="font-normal text-slate-500"> ({groupDistance(group).toLocaleString()})</span>
                {group.note && <span className="font-sans text-sm font-normal text-slate-500"> · {group.note}</span>}
              </p>
            ) : (
              group.note && (
                <p className="mb-1 font-sans text-xs font-semibold uppercase tracking-wide text-slate-500">{group.note}</p>
              )
            )}
            <ul className={repeated ? "mt-1 space-y-1 border-l-2 border-sky-200 pl-4" : "space-y-1"}>
              {group.lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {formatLine(line)}
                  {line.note && <span className="font-sans text-sm text-slate-500"> · {line.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
