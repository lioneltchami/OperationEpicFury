import { describe, expect, it } from "vitest";
import { timeScore } from "@/lib/kv";

describe("timeScore", () => {
  it("converts '2026-03-01 14:30' to 202603011430", () => {
    expect(timeScore("2026-03-01 14:30")).toBe(202603011430);
  });

  it("converts '2026-02-28 08:00' to 202602280800", () => {
    expect(timeScore("2026-02-28 08:00")).toBe(202602280800);
  });

  it("converts '2026-01-01 00:00' to 202601010000", () => {
    expect(timeScore("2026-01-01 00:00")).toBe(202601010000);
  });

  it("converts '2026-12-31 23:59' to 202612312359", () => {
    expect(timeScore("2026-12-31 23:59")).toBe(202612312359);
  });

  it("strips non-digit characters correctly", () => {
    // The regex /\D/g removes all non-digits
    expect(timeScore("2026-03-01 14:30")).toBe(202603011430);
  });

  it("returns 0 for undefined input", () => {
    expect(timeScore(undefined)).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(timeScore("")).toBe(0);
  });

  it("returns 0 for non-numeric string after stripping", () => {
    expect(timeScore("no-digits-here")).toBe(0);
  });

  it("handles legacy-style time (just digits)", () => {
    // If someone passed "1430" it would become 1430
    expect(timeScore("1430")).toBe(1430);
  });

  it("maintains chronological ordering", () => {
    const earlier = timeScore("2026-02-28 08:00");
    const later = timeScore("2026-03-01 14:30");
    expect(later).toBeGreaterThan(earlier);
  });
});
