import { describe, expect, it } from "vitest";
import {
  etToDate,
  etToTehran,
  formatDate,
  formatDateLabel,
  formatTehranDateLabel,
  formatTime,
  parseTimeET,
} from "@/lib/time-utils";

// ---------------------------------------------------------------------------
// parseTimeET
// ---------------------------------------------------------------------------
describe("parseTimeET", () => {
  it("parses legacy HH:MM format with default date 2026-02-28", () => {
    const result = parseTimeET("14:30");
    expect(result).toEqual({ date: "2026-02-28", time: "14:30" });
  });

  it("parses new YYYY-MM-DD HH:MM format", () => {
    const result = parseTimeET("2026-03-01 08:15");
    expect(result).toEqual({ date: "2026-03-01", time: "08:15" });
  });

  it("handles midnight in new format", () => {
    const result = parseTimeET("2026-03-01 00:00");
    expect(result).toEqual({ date: "2026-03-01", time: "00:00" });
  });

  it("handles legacy midnight", () => {
    const result = parseTimeET("00:00");
    expect(result).toEqual({ date: "2026-02-28", time: "00:00" });
  });

  it("trims whitespace", () => {
    const result = parseTimeET("  2026-03-01 14:30  ");
    expect(result).toEqual({ date: "2026-03-01", time: "14:30" });
  });
});

// ---------------------------------------------------------------------------
// etToTehran
// ---------------------------------------------------------------------------
describe("etToTehran", () => {
  it("adds 8h30m offset for a midday time (no day rollover)", () => {
    // 2026-03-01 10:00 ET + 8:30 = 2026-03-01 18:30 Tehran
    expect(etToTehran("2026-03-01 10:00")).toBe("2026-03-01 18:30");
  });

  it("adds 8h30m offset with minute carry", () => {
    // 2026-03-01 10:45 ET + 8:30 = 2026-03-01 19:15 Tehran
    expect(etToTehran("2026-03-01 10:45")).toBe("2026-03-01 19:15");
  });

  it("handles day rollover when hour exceeds 24", () => {
    // 2026-03-01 20:00 ET + 8:30 = 2026-03-02 04:30 Tehran
    expect(etToTehran("2026-03-01 20:00")).toBe("2026-03-02 04:30");
  });

  it("handles day rollover with minute carry", () => {
    // 2026-03-01 16:45 ET + 8:30 = 2026-03-02 01:15 Tehran
    expect(etToTehran("2026-03-01 16:45")).toBe("2026-03-02 01:15");
  });

  it("handles midnight ET", () => {
    // 2026-03-01 00:00 ET + 8:30 = 2026-03-01 08:30 Tehran
    expect(etToTehran("2026-03-01 00:00")).toBe("2026-03-01 08:30");
  });

  it("handles exact boundary: 15:30 ET becomes midnight Tehran", () => {
    // 2026-03-01 15:30 ET + 8:30 = 2026-03-02 00:00 Tehran
    expect(etToTehran("2026-03-01 15:30")).toBe("2026-03-02 00:00");
  });

  it("handles month boundary rollover", () => {
    // 2026-02-28 20:00 ET + 8:30 = 2026-03-01 04:30 Tehran
    expect(etToTehran("2026-02-28 20:00")).toBe("2026-03-01 04:30");
  });

  it("handles legacy HH:MM format", () => {
    // Legacy format assumes 2026-02-28
    // 14:00 ET + 8:30 = 22:30 Tehran (same day)
    expect(etToTehran("14:00")).toBe("2026-02-28 22:30");
  });
});

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------
describe("formatTime", () => {
  it("extracts time from full format", () => {
    expect(formatTime("2026-03-01 14:30")).toBe("14:30");
  });

  it("extracts time from legacy format", () => {
    expect(formatTime("08:15")).toBe("08:15");
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe("formatDate", () => {
  it("extracts date from full format", () => {
    expect(formatDate("2026-03-01 14:30")).toBe("2026-03-01");
  });

  it("returns default date for legacy format", () => {
    expect(formatDate("14:30")).toBe("2026-02-28");
  });
});

// ---------------------------------------------------------------------------
// formatDateLabel
// ---------------------------------------------------------------------------
describe("formatDateLabel", () => {
  it("formats date as short month and day", () => {
    expect(formatDateLabel("2026-03-01 14:30")).toBe("Mar 1");
  });

  it("formats February date correctly", () => {
    expect(formatDateLabel("2026-02-28 10:00")).toBe("Feb 28");
  });
});

// ---------------------------------------------------------------------------
// formatTehranDateLabel
// ---------------------------------------------------------------------------
describe("formatTehranDateLabel", () => {
  it("returns Tehran date label (no rollover)", () => {
    // 2026-03-01 10:00 ET => Tehran 2026-03-01 18:30 => "Mar 1"
    expect(formatTehranDateLabel("2026-03-01 10:00")).toBe("Mar 1");
  });

  it("returns Tehran date label (with day rollover)", () => {
    // 2026-03-01 20:00 ET => Tehran 2026-03-02 04:30 => "Mar 2"
    expect(formatTehranDateLabel("2026-03-01 20:00")).toBe("Mar 2");
  });
});

// ---------------------------------------------------------------------------
// etToDate
// ---------------------------------------------------------------------------
describe("etToDate", () => {
  it("returns a Date object", () => {
    const result = etToDate("2026-03-01 14:30");
    expect(result).toBeInstanceOf(Date);
  });

  it("returns a valid (non-NaN) Date", () => {
    const result = etToDate("2026-03-01 14:30");
    expect(result.getTime()).not.toBeNaN();
  });

  it("handles legacy format", () => {
    const result = etToDate("14:30");
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).not.toBeNaN();
  });

  it("produces consistent results for the same input", () => {
    const a = etToDate("2026-03-01 10:00");
    const b = etToDate("2026-03-01 10:00");
    expect(a.getTime()).toBe(b.getTime());
  });

  it("later ET times produce later Date values", () => {
    const early = etToDate("2026-03-01 08:00");
    const late = etToDate("2026-03-01 20:00");
    expect(late.getTime()).toBeGreaterThan(early.getTime());
  });
});
