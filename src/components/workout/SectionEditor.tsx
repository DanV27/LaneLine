"use client";

import { EQUIPMENT_OPTIONS } from "@/lib/workout/options";
import { fastestPacePer100 } from "@/lib/workout/pace";
import { LINE_STROKES, LINE_TYPES, type Section, type SetGroup, type SetLine } from "@/lib/workout/schema";
import { groupDistance } from "@/lib/workout/totals";
import { IntervalField, NumberField, smallInputClass } from "./inputs";

const STROKE_LABELS: Record<SetLine["stroke"], string> = {
  FREE: "Free",
  BACK: "Back",
  BREAST: "Breast",
  FLY: "Fly",
  IM: "IM",
  CHOICE: "Choice",
};
const TYPE_LABELS: Record<SetLine["type"], string> = { SWIM: "Swim", KICK: "Kick", PULL: "Pull", DRILL: "Drill" };

type Timing = "interval" | "rest" | "none";

const timingOf = (line: SetLine): Timing => (line.intervals ? "interval" : line.restSeconds !== undefined ? "rest" : "none");

/** A comfortable send-off for this line: a bit slower than the swimmer's fastest pace, rounded to 5s. */
function suggestedInterval(line: SetLine, basePace: number): number {
  const seconds = (fastestPacePer100(line, basePace) * line.distance * 1.15) / 100;
  return Math.max(5, Math.round(seconds / 5) * 5);
}

function replaceAt<T>(items: T[], index: number, item: T): T[] {
  return items.map((current, i) => (i === index ? item : current));
}

function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function IconButton({ label, onClick, disabled, children }: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function LineEditor({ line, basePace, onChange, onDelete, onMoveUp, onMoveDown }: {
  line: SetLine;
  basePace: number;
  onChange: (line: SetLine) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const set = (patch: Partial<SetLine>) => onChange({ ...line, ...patch });
  const timing = timingOf(line);

  function setTiming(next: Timing) {
    if (next === "interval") set({ intervals: { A: suggestedInterval(line, basePace) }, restSeconds: undefined });
    else if (next === "rest") set({ intervals: undefined, restSeconds: 15 });
    else set({ intervals: undefined, restSeconds: undefined });
  }

  function toggleEquipment(item: SetLine["equipment"][number]) {
    set({
      equipment: line.equipment.includes(item)
        ? line.equipment.filter((current) => current !== item)
        : [...line.equipment, item],
    });
  }

  return (
    <div className="space-y-1.5 rounded-md bg-white p-2 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-1.5">
        <NumberField label="Reps" value={line.reps} min={1} max={50} onCommit={(reps) => set({ reps })} className="w-12 text-center" />
        <span className="text-slate-400">×</span>
        <NumberField
          label="Distance"
          value={line.distance}
          min={25}
          max={3000}
          onCommit={(distance) => set({ distance })}
          className="w-16 text-center"
        />
        <select
          aria-label="Stroke"
          value={line.stroke}
          onChange={(event) => set({ stroke: event.target.value as SetLine["stroke"] })}
          className={smallInputClass}
        >
          {LINE_STROKES.map((stroke) => (
            <option key={stroke} value={stroke}>
              {STROKE_LABELS[stroke]}
            </option>
          ))}
        </select>
        <select
          aria-label="Type"
          value={line.type}
          onChange={(event) => set({ type: event.target.value as SetLine["type"] })}
          className={smallInputClass}
        >
          {LINE_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <select
          aria-label="Timing"
          value={timing}
          onChange={(event) => setTiming(event.target.value as Timing)}
          className={smallInputClass}
        >
          <option value="interval">@ send-off</option>
          <option value="rest">Rest</option>
          <option value="none">No clock</option>
        </select>
        {line.intervals && (
          <IntervalField
            label="Send-off"
            value={line.intervals.A}
            onCommit={(A) => set({ intervals: { ...line.intervals, A } })}
            className="w-16 text-center"
          />
        )}
        {timing === "rest" && (
          <IntervalField
            label="Rest"
            value={line.restSeconds ?? 15}
            max={300}
            onCommit={(restSeconds) => set({ restSeconds })}
            className="w-16 text-center"
          />
        )}
        <div className="ml-auto flex">
          <IconButton label="Move line up" onClick={() => onMoveUp?.()} disabled={!onMoveUp}>↑</IconButton>
          <IconButton label="Move line down" onClick={() => onMoveDown?.()} disabled={!onMoveDown}>↓</IconButton>
          <IconButton label="Delete line" onClick={onDelete}>✕</IconButton>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          aria-label="Note"
          placeholder="Note, e.g. descend 1-4"
          maxLength={200}
          value={line.note ?? ""}
          onChange={(event) => set({ note: event.target.value || undefined })}
          className={`${smallInputClass} min-w-40 flex-1`}
        />
        {EQUIPMENT_OPTIONS.map((option) => {
          const on = line.equipment.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggleEquipment(option.value)}
              className={`rounded-full border px-2 py-0.5 text-xs ${
                on ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 text-slate-500 hover:border-sky-400"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A sensible default line for "add line": 4 × 100 free on a comfortable send-off. */
export function blankLine(basePace: number): SetLine {
  const line: SetLine = { reps: 4, distance: 100, stroke: "FREE", type: "SWIM", equipment: [] };
  return { ...line, intervals: { A: suggestedInterval(line, basePace) } };
}

/** Edits one section's groups and lines. Empty groups are dropped; the parent drops empty sections. */
export function SectionEditor({ section, basePace, onChange }: {
  section: Section;
  basePace: number;
  onChange: (section: Section) => void;
}) {
  const setGroups = (groups: SetGroup[]) =>
    onChange({ ...section, groups: groups.filter((group) => group.lines.length > 0) });

  return (
    <div className="space-y-3">
      {section.groups.map((group, groupIndex) => {
        const setGroup = (next: SetGroup) => setGroups(replaceAt(section.groups, groupIndex, next));
        const setLines = (lines: SetLine[]) => setGroup({ ...group, lines });

        return (
          <div key={groupIndex} className="space-y-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <label className="flex items-center gap-1.5 text-slate-600">
                <NumberField
                  label="Rounds"
                  value={group.rounds}
                  min={1}
                  max={20}
                  onCommit={(rounds) => setGroup({ ...group, rounds })}
                  className="w-12 text-center"
                />
                {group.rounds === 1 ? "round" : "rounds"}
              </label>
              <input
                aria-label="Group note"
                placeholder="Group note (optional)"
                maxLength={200}
                value={group.note ?? ""}
                onChange={(event) => setGroup({ ...group, note: event.target.value || undefined })}
                className={`${smallInputClass} min-w-40 flex-1`}
              />
              <span className="tabular-nums text-slate-500">{groupDistance(group).toLocaleString()}</span>
              <IconButton label="Delete group" onClick={() => setLines([])}>✕</IconButton>
            </div>

            {group.lines.map((line, lineIndex) => (
              <LineEditor
                key={lineIndex}
                line={line}
                basePace={basePace}
                onChange={(next) => setLines(replaceAt(group.lines, lineIndex, next))}
                onDelete={() => setLines(group.lines.filter((_, i) => i !== lineIndex))}
                onMoveUp={lineIndex > 0 ? () => setLines(move(group.lines, lineIndex, lineIndex - 1)) : undefined}
                onMoveDown={
                  lineIndex < group.lines.length - 1 ? () => setLines(move(group.lines, lineIndex, lineIndex + 1)) : undefined
                }
              />
            ))}

            <button
              type="button"
              onClick={() => setLines([...group.lines, blankLine(basePace)])}
              className="text-sm font-medium text-sky-700 hover:text-sky-900"
            >
              + Add line
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => setGroups([...section.groups, { rounds: 1, lines: [blankLine(basePace)] }])}
        className="text-sm font-medium text-sky-700 hover:text-sky-900"
      >
        + Add group
      </button>
    </div>
  );
}
