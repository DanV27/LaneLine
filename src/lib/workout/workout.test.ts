import { describe, expect, it } from "vitest";
import { formatDuration, formatLine, workoutToText } from "./format";
import type { SetLine, WorkoutContent } from "./schema";
import { formatInterval, parseInterval } from "./time";
import { estimateSeconds, workoutDistance } from "./totals";

const line = (overrides: Partial<SetLine>): SetLine => ({
  reps: 1,
  distance: 100,
  stroke: "FREE",
  type: "SWIM",
  equipment: [],
  ...overrides,
});

describe("intervals", () => {
  it("parses m:ss, :ss and bare seconds", () => {
    expect(parseInterval("1:20")).toBe(80);
    expect(parseInterval(":45")).toBe(45);
    expect(parseInterval("90")).toBe(90);
    expect(parseInterval("1:75")).toBeNull();
    expect(parseInterval("abc")).toBeNull();
  });

  it("formats seconds as swim intervals", () => {
    expect(formatInterval(80)).toBe("1:20");
    expect(formatInterval(45)).toBe(":45");
    expect(formatInterval(125)).toBe("2:05");
  });
});

describe("formatLine", () => {
  it("writes standard swim notation", () => {
    expect(formatLine(line({ reps: 4, intervals: { A: 80 } }))).toBe("4 × 100 free @ 1:20");
    expect(formatLine(line({ distance: 400, stroke: "CHOICE" }))).toBe("400 choice");
    expect(formatLine(line({ reps: 8, distance: 25, stroke: "FLY", type: "KICK", restSeconds: 15 }))).toBe(
      "8 × 25 fly kick :15 rest",
    );
    expect(formatLine(line({ distance: 200, type: "PULL", equipment: ["PADDLES", "PULL_BUOY"] }))).toBe(
      "200 free pull w/ paddles, pull buoy",
    );
  });

  it("formats durations", () => {
    expect(formatDuration(2700)).toBe("45m");
    expect(formatDuration(4500)).toBe("1h 15m");
  });
});

describe("totals", () => {
  const content: WorkoutContent = {
    sections: [
      { id: "w", kind: "WARMUP", title: "Warm-up", groups: [{ rounds: 1, lines: [line({ distance: 400 })] }] },
      {
        id: "m",
        kind: "MAIN",
        title: "Main",
        groups: [
          {
            rounds: 3,
            lines: [line({ reps: 4, intervals: { A: 80 } }), line({ distance: 200, type: "PULL", intervals: { A: 180 } })],
          },
        ],
      },
    ],
  };

  it("multiplies reps and rounds", () => {
    // 400 + 3 × (4×100 + 200)
    expect(workoutDistance(content)).toBe(2200);
  });

  it("renders a plain-text whiteboard version", () => {
    expect(workoutToText(content)).toBe(
      ["Warm-up [WARMUP, 400]", "  400 free", "", "Main [MAIN, 1800]", "  3 rounds:", "    4 × 100 free @ 1:20", "    200 free pull @ 3:00"].join("\n"),
    );
  });

  it("estimates time from send-offs, and base pace where there are none", () => {
    // Main: 3 × (4×80 + 180) = 1500s. Warm-up: 4 × 80s × 1.15 easy = 368s.
    expect(estimateSeconds(content, 80)).toBe(1868);
  });
});
