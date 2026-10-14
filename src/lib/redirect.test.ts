import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/workouts/import")).toBe("/workouts/import");
  });

  it("rejects other sites and junk", () => {
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext(["/a", "/b"])).toBe("/");
    expect(safeNext(undefined, "/workouts")).toBe("/workouts");
  });
});
