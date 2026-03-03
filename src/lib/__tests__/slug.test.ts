import { describe, expect, it, vi } from "vitest";
import { generateSlug } from "@/lib/slug";

describe("generateSlug", () => {
  // --- Basic transformation ---
  it("converts a headline to a lowercase hyphenated slug", () => {
    expect(generateSlug("First Explosions Rock Tehran")).toBe(
      "first-explosions-rock-tehran",
    );
  });

  it("replaces multiple spaces with a single hyphen", () => {
    expect(generateSlug("Hello   World")).toBe("hello-world");
  });

  // --- Special characters ---
  it("strips special characters", () => {
    expect(generateSlug("Breaking: War Starts!")).toBe("breaking-war-starts");
  });

  it("handles ampersands and symbols", () => {
    expect(generateSlug("US & Iran: Update #5")).toBe("us-iran-update-5");
  });

  // --- Apostrophes ---
  it("removes straight apostrophes", () => {
    expect(generateSlug("don't stop")).toBe("dont-stop");
  });

  it("treats curly apostrophes as non-alphanumeric (converted to hyphen)", () => {
    // The regex only strips ASCII straight quotes; curly U+2019 becomes a hyphen
    expect(generateSlug("don\u2019t stop")).toBe("don-t-stop");
  });

  // --- Leading and trailing hyphens ---
  it("trims leading hyphens", () => {
    expect(generateSlug("---Leading")).toBe("leading");
  });

  it("trims trailing hyphens", () => {
    expect(generateSlug("Trailing---")).toBe("trailing");
  });

  it("trims both leading and trailing hyphens from special characters", () => {
    expect(generateSlug("!!Hello!!")).toBe("hello");
  });

  // --- Max length ---
  it("caps slug length at 80 characters", () => {
    const longHeadline = "A".repeat(100);
    const slug = generateSlug(longHeadline);
    expect(slug.length).toBeLessThanOrEqual(80);
  });

  it("does not cut in the middle when headline is exactly 80 chars of valid text", () => {
    const headline = "a".repeat(80);
    expect(generateSlug(headline)).toBe(headline);
  });

  // --- Deduplication ---
  it("returns base slug when not in existingSlugs", () => {
    const existing = new Set(["other-slug"]);
    expect(generateSlug("My Event", existing)).toBe("my-event");
  });

  it("appends -2 when slug exists in existingSlugs", () => {
    const existing = new Set(["my-event"]);
    expect(generateSlug("My Event", existing)).toBe("my-event-2");
  });

  it("appends -3 when slug and slug-2 both exist", () => {
    const existing = new Set(["my-event", "my-event-2"]);
    expect(generateSlug("My Event", existing)).toBe("my-event-3");
  });

  it("increments to the next available suffix", () => {
    const existing = new Set([
      "my-event",
      "my-event-2",
      "my-event-3",
      "my-event-4",
    ]);
    expect(generateSlug("My Event", existing)).toBe("my-event-5");
  });

  // --- Empty headline fallback ---
  it("falls back to event- prefix with timestamp for empty headline", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const slug = generateSlug("");
    expect(slug).toBe(`event-${now}`);
    vi.restoreAllMocks();
  });

  it("falls back for undefined-like empty string", () => {
    const slug = generateSlug("");
    expect(slug).toMatch(/^event-\d+$/);
  });

  // --- Edge cases ---
  it("returns empty string for headline of all special characters", () => {
    // The fallback only triggers for falsy original input, not empty post-processing result
    const slug = generateSlug("!!!@@@###$$$");
    expect(slug).toBe("");
  });

  it("handles numeric-only headline", () => {
    expect(generateSlug("12345")).toBe("12345");
  });

  it("handles mixed case", () => {
    expect(generateSlug("AbCdEf")).toBe("abcdef");
  });
});
