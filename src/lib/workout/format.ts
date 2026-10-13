import { EQUIPMENT_OPTIONS, labelFor } from "./options";
import type { SetLine } from "./schema";
import { formatInterval } from "./time";

const STROKE_TEXT: Record<SetLine["stroke"], string> = {
  FREE: "free",
  BACK: "back",
  BREAST: "breast",
  FLY: "fly",
  IM: "IM",
  CHOICE: "choice",
};

/** "4 × 100 free @ 1:20", "200 pull w/ paddles, pull buoy", "8 × 25 fly kick :15 rest" */
export function formatLine(line: SetLine): string {
  const parts: string[] = [];
  parts.push(line.reps > 1 ? `${line.reps} × ${line.distance}` : `${line.distance}`);
  parts.push(STROKE_TEXT[line.stroke]);
  if (line.type !== "SWIM") parts.push(line.type.toLowerCase());
  if (line.equipment.length > 0) {
    parts.push(`w/ ${line.equipment.map((item) => labelFor(EQUIPMENT_OPTIONS, item).toLowerCase()).join(", ")}`);
  }
  if (line.intervals) parts.push(`@ ${formatInterval(line.intervals.A)}`);
  else if (line.restSeconds) parts.push(`${formatInterval(line.restSeconds)} rest`);
  return parts.join(" ");
}

/** 4500 -> "1h 15m", 2700 -> "45m" */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${String(minutes % 60).padStart(2, "0")}m` : `${minutes}m`;
}
