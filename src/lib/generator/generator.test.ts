import { describe, expect, it } from "vitest";
import type { SetLine, WorkoutContent } from "@/lib/workout/schema";
import { checkWorkout } from "./check";
import { draftToContent, type WorkoutDraft } from "./draft";

const line = (overrides: Partial<SetLine>): SetLine => ({
  reps: 1,
  distance: 100,
  stroke: "FREE",
  type: "SWIM",
  equipment: [],
  ...overrides,
});

const workout = (...lines: SetLine[]): WorkoutContent => ({
  sections: [{ id: "m", kind: "MAIN", title: "Main", groups: [{ rounds: 1, lines }] }],
});

describe("checkWorkout", () => {
  const context = { pool: "SCY" as const, target: { distance: 1000 }, basePace: 80 };

  it("passes a workout that adds up with makeable send-offs", () => {
    expect(checkWorkout(workout(line({ reps: 10, intervals: { A: 90 } })), context)).toEqual([]);
  });

  it("flags a total that misses the target", () => {
    const problems = checkWorkout(workout(line({ reps: 6, intervals: { A: 90 } })), context);
    expect(problems).toEqual(["Sections add up to 600, but the workout should total 1000."]);
  });

  it("accepts a small drift inside the tolerance", () => {
    expect(checkWorkout(workout(line({ reps: 9, intervals: { A: 90 } })), context)).toEqual([]);
  });

  it("flags distances that don't fit the pool", () => {
    const problems = checkWorkout(workout(line({ reps: 1, distance: 1000 }), line({ distance: 75 })), {
      ...context,
      pool: "LCM",
      target: { distance: 1075 },
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("75 isn't a whole number of 50-length laps");
  });

  it("flags send-offs faster than the swimmer can hold", () => {
    const problems = checkWorkout(workout(line({ reps: 10, intervals: { A: 65 } })), context);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("faster than this swimmer can hold");
  });

  it("allows slower send-offs for kick than its pace floor, but flags kick on swim pace", () => {
    const kick = (A: number) => line({ reps: 10, type: "KICK", intervals: { A } });
    expect(checkWorkout(workout(kick(110)), context)).toEqual([]);
    expect(checkWorkout(workout(kick(80)), context)[0]).toContain("faster than this swimmer can hold");
  });

  it("checks time targets against the estimate", () => {
    const timed = { ...context, target: { seconds: 900 } };
    expect(checkWorkout(workout(line({ reps: 10, intervals: { A: 90 } })), timed)).toEqual([]);
    expect(checkWorkout(workout(line({ reps: 5, intervals: { A: 90 } })), timed)[0]).toContain(
      "Estimated time is 8 minutes",
    );
  });
});

describe("draftToContent", () => {
  it("drops nulls, assigns ids, and prefers send-off over rest", () => {
    const draft: WorkoutDraft = {
      title: "Test",
      sections: [
        {
          kind: "MAIN",
          title: "Main",
          groups: [
            {
              rounds: 2,
              note: null,
              lines: [
                { reps: 4, distance: 100, stroke: "FREE", type: "SWIM", intervalSeconds: 80, restSeconds: 10, equipment: [], note: null },
              ],
            },
          ],
        },
      ],
    };
    const content = draftToContent(draft);
    expect(content.sections[0].id).toBe("main-1");
    expect(content.sections[0].groups[0].lines[0]).toEqual({
      reps: 4,
      distance: 100,
      stroke: "FREE",
      type: "SWIM",
      intervals: { A: 80 },
      restSeconds: undefined,
      equipment: [],
      note: undefined,
    });
  });
});
