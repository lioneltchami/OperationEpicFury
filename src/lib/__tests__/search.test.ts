import { describe, expect, it } from "vitest";
import type { TimelineEvent } from "@/data/timeline";
import { eventTokens, tokenize } from "@/lib/search";

// Helper: minimal valid TimelineEvent
function makeEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: "evt-1",
    timeET: "2026-03-01 14:30",
    headline: "Test Headline Here",
    body: "Test body content text",
    category: "strike",
    source: "Reuters",
    sourceUrl: "https://reuters.com",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// tokenize
// ---------------------------------------------------------------------------
describe("tokenize", () => {
  it("splits text into lowercase tokens", () => {
    const tokens = tokenize("Hello World");
    expect(tokens).toContain("hello");
    expect(tokens).toContain("world");
  });

  it("filters tokens shorter than 2 characters", () => {
    const tokens = tokenize("I am a big cat");
    expect(tokens).not.toContain("i");
    expect(tokens).not.toContain("a");
    expect(tokens).toContain("am");
    expect(tokens).toContain("big");
    expect(tokens).toContain("cat");
  });

  it("handles special characters by replacing them with spaces", () => {
    const tokens = tokenize("Hello, world! This is test.");
    expect(tokens).toContain("hello");
    expect(tokens).toContain("world");
    expect(tokens).toContain("this");
    expect(tokens).toContain("is");
    expect(tokens).toContain("test");
    // Commas and periods should not appear
    expect(tokens.some((t) => t.includes(","))).toBe(false);
    expect(tokens.some((t) => t.includes("."))).toBe(false);
  });

  it("handles empty string", () => {
    const tokens = tokenize("");
    expect(tokens).toEqual([]);
  });

  it("handles string of only special characters", () => {
    const tokens = tokenize("!@#$%^&*()");
    expect(tokens).toEqual([]);
  });

  it("handles multiple spaces between words", () => {
    const tokens = tokenize("foo   bar   baz");
    expect(tokens).toEqual(["foo", "bar", "baz"]);
  });

  it("keeps underscores as part of tokens (\\w includes _)", () => {
    const tokens = tokenize("hello_world test");
    expect(tokens).toContain("hello_world");
    expect(tokens).toContain("test");
  });

  it("handles numeric tokens", () => {
    const tokens = tokenize("Event 42 happened");
    expect(tokens).toContain("event");
    expect(tokens).toContain("42");
    expect(tokens).toContain("happened");
  });

  it("preserves duplicate tokens (tokenize itself does not deduplicate)", () => {
    const tokens = tokenize("hello hello hello");
    expect(tokens.filter((t) => t === "hello")).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// eventTokens
// ---------------------------------------------------------------------------
describe("eventTokens", () => {
  it("combines headline, body, source, and category tokens", () => {
    const event = makeEvent({
      headline: "Major Strike",
      body: "Details of the strike",
      source: "CNN",
      category: "strike",
    });
    const tokens = eventTokens(event);
    expect(tokens).toContain("major");
    expect(tokens).toContain("strike");
    expect(tokens).toContain("details");
    expect(tokens).toContain("cnn");
  });

  it("includes headline_fr and body_fr tokens when present", () => {
    const event = makeEvent({
      headline_fr: "Titre en francais",
      body_fr: "Corps du texte important",
    });
    const tokens = eventTokens(event);
    expect(tokens).toContain("titre");
    expect(tokens).toContain("francais");
    expect(tokens).toContain("corps");
    expect(tokens).toContain("important");
  });

  it("handles null/undefined optional fields gracefully", () => {
    const event = makeEvent({
      headline_fr: undefined,
      body_fr: undefined,
    });
    // Should not throw
    const tokens = eventTokens(event);
    expect(tokens.length).toBeGreaterThan(0);
  });

  it("returns deduplicated token array", () => {
    // "strike" appears in both headline and category
    const event = makeEvent({
      headline: "Strike on city",
      body: "A major strike occurred",
      category: "strike",
    });
    const tokens = eventTokens(event);
    const strikeCount = tokens.filter((t) => t === "strike").length;
    expect(strikeCount).toBe(1);
  });

  it("returns unique tokens set", () => {
    const event = makeEvent();
    const tokens = eventTokens(event);
    const unique = new Set(tokens);
    expect(tokens.length).toBe(unique.size);
  });

  it("handles event with minimal fields", () => {
    const event = makeEvent({
      headline: "Hi",
      body: "Go",
      source: "AP",
    });
    const tokens = eventTokens(event);
    // "hi" is 2 chars, "go" is 2 chars, "ap" is 2 chars, "strike" is 6 chars
    expect(tokens).toContain("hi");
    expect(tokens).toContain("go");
    expect(tokens).toContain("ap");
    expect(tokens).toContain("strike");
  });
});
