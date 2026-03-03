import { describe, expect, it } from "vitest";
import { validateEventInput, validateEventUpdate } from "@/lib/validate-event";

// Helper: minimal valid event input
function validInput(overrides: Record<string, unknown> = {}) {
  return {
    headline: "Test Headline",
    body: "Test body content",
    category: "strike",
    timeET: "2026-03-01 14:30",
    source: "Reuters",
    sourceUrl: "https://reuters.com/article",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateEventInput
// ---------------------------------------------------------------------------
describe("validateEventInput", () => {
  // --- Happy path ---
  it("returns valid:true with data for a complete valid event", () => {
    const result = validateEventInput(validInput());
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.headline).toBe("Test Headline");
      expect(result.data.body).toBe("Test body content");
      expect(result.data.category).toBe("strike");
      expect(result.data.timeET).toBe("2026-03-01 14:30");
      expect(result.data.source).toBe("Reuters");
      expect(result.data.sourceUrl).toBe("https://reuters.com/article");
    }
  });

  // --- Non-object input ---
  it("rejects null input", () => {
    const result = validateEventInput(null);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/JSON object/);
  });

  it("rejects undefined input", () => {
    const result = validateEventInput(undefined);
    expect(result.valid).toBe(false);
  });

  it("rejects a string input", () => {
    const result = validateEventInput("not an object");
    expect(result.valid).toBe(false);
  });

  it("rejects a number input", () => {
    const result = validateEventInput(42);
    expect(result.valid).toBe(false);
  });

  // --- Missing required fields ---
  it("rejects missing headline", () => {
    const { headline: _headline, ...rest } = validInput();
    const result = validateEventInput(rest);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/headline/);
  });

  it("rejects empty headline", () => {
    const result = validateEventInput(validInput({ headline: "   " }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/headline/);
  });

  it("rejects missing body", () => {
    const { body: _body, ...rest } = validInput();
    const result = validateEventInput(rest);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/body/);
  });

  it("rejects missing category", () => {
    const { category: _category, ...rest } = validInput();
    const result = validateEventInput(rest);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/category/);
  });

  it("rejects missing timeET", () => {
    const { timeET: _timeET, ...rest } = validInput();
    const result = validateEventInput(rest);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/timeET/);
  });

  it("rejects missing source", () => {
    const { source: _source, ...rest } = validInput();
    const result = validateEventInput(rest);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/source/);
  });

  it("rejects missing sourceUrl", () => {
    const { sourceUrl: _sourceUrl, ...rest } = validInput();
    const result = validateEventInput(rest);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/sourceUrl/);
  });

  // --- Invalid category ---
  it("rejects an invalid category value", () => {
    const result = validateEventInput(validInput({ category: "unknown" }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/category/);
  });

  it("accepts every valid category", () => {
    const categories = [
      "strike",
      "retaliation",
      "announcement",
      "casualty",
      "world-reaction",
      "breaking",
      "breaking-important",
    ];
    for (const category of categories) {
      const result = validateEventInput(validInput({ category }));
      expect(result.valid).toBe(true);
    }
  });

  // --- Invalid timeET format ---
  it("rejects timeET without date (bare HH:MM)", () => {
    const result = validateEventInput(validInput({ timeET: "14:30" }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/timeET/);
  });

  it("rejects timeET with extra seconds", () => {
    const result = validateEventInput(
      validInput({ timeET: "2026-03-01 14:30:00" }),
    );
    expect(result.valid).toBe(false);
  });

  it("rejects timeET with wrong separator", () => {
    const result = validateEventInput(
      validInput({ timeET: "2026/03/01 14:30" }),
    );
    expect(result.valid).toBe(false);
  });

  // --- Length limits ---
  it("rejects headline over 500 characters", () => {
    const result = validateEventInput(
      validInput({ headline: "A".repeat(501) }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/500/);
  });

  it("accepts headline of exactly 500 characters", () => {
    const result = validateEventInput(
      validInput({ headline: "A".repeat(500) }),
    );
    expect(result.valid).toBe(true);
  });

  it("rejects body over 10000 characters", () => {
    const result = validateEventInput(validInput({ body: "B".repeat(10001) }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/10000/);
  });

  it("accepts body of exactly 10000 characters", () => {
    const result = validateEventInput(validInput({ body: "B".repeat(10000) }));
    expect(result.valid).toBe(true);
  });

  it("rejects source over 200 characters", () => {
    const result = validateEventInput(validInput({ source: "S".repeat(201) }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/200/);
  });

  it("rejects sourceUrl over 2000 characters", () => {
    const result = validateEventInput(
      validInput({ sourceUrl: "https://x.com/" + "u".repeat(2000) }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/2000/);
  });

  // --- Optional fields ---
  it("accepts valid media array", () => {
    const result = validateEventInput(
      validInput({
        media: [{ fileId: "abc", type: "photo" }],
      }),
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.media).toHaveLength(1);
      expect(result.data.media![0].fileId).toBe("abc");
      expect(result.data.media![0].type).toBe("photo");
    }
  });

  it("defaults media type to photo when invalid", () => {
    const result = validateEventInput(
      validInput({
        media: [{ fileId: "abc", type: "gif" }],
      }),
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.media![0].type).toBe("photo");
    }
  });

  it("accepts valid location", () => {
    const result = validateEventInput(
      validInput({
        location: { lat: 35.6892, lng: 51.389, name: "Tehran" },
      }),
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.location).toEqual({
        lat: 35.6892,
        lng: 51.389,
        name: "Tehran",
      });
    }
  });

  it("ignores invalid location (lat out of range)", () => {
    const result = validateEventInput(
      validInput({
        location: { lat: 91, lng: 51.389, name: "Bad" },
      }),
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.location).toBeUndefined();
    }
  });

  it("ignores invalid location (missing name)", () => {
    const result = validateEventInput(
      validInput({
        location: { lat: 35.0, lng: 51.0 },
      }),
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.location).toBeUndefined();
    }
  });

  it("ignores invalid location (empty name)", () => {
    const result = validateEventInput(
      validInput({
        location: { lat: 35.0, lng: 51.0, name: "" },
      }),
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.location).toBeUndefined();
    }
  });

  it("accepts valid sources array", () => {
    const result = validateEventInput(
      validInput({
        sources: [
          { name: "Reuters", url: "https://reuters.com", region: "eu" },
        ],
      }),
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.sources).toHaveLength(1);
      expect(result.data.sources![0].name).toBe("Reuters");
      expect(result.data.sources![0].region).toBe("eu");
    }
  });

  it("filters out invalid items from sources array", () => {
    const result = validateEventInput(
      validInput({
        sources: [
          { name: "Reuters", url: "https://reuters.com" },
          "not-an-object",
          null,
          { name: "missing url" },
        ],
      }),
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.sources).toHaveLength(1);
    }
  });

  it("accepts valid confidence level", () => {
    for (const confidence of ["confirmed", "unconfirmed", "disputed"]) {
      const result = validateEventInput(validInput({ confidence }));
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.confidence).toBe(confidence);
      }
    }
  });

  it("ignores invalid confidence level", () => {
    const result = validateEventInput(validInput({ confidence: "maybe" }));
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.confidence).toBeUndefined();
    }
  });

  it("accepts valid status values", () => {
    for (const status of ["draft", "published"]) {
      const result = validateEventInput(validInput({ status }));
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.status).toBe(status);
      }
    }
  });

  it("accepts breaking boolean", () => {
    const result = validateEventInput(validInput({ breaking: true }));
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.breaking).toBe(true);
    }
  });

  it("accepts headline_fr and body_fr", () => {
    const result = validateEventInput(
      validInput({
        headline_fr: "Titre en francais",
        body_fr: "Corps du texte",
      }),
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.headline_fr).toBe("Titre en francais");
      expect(result.data.body_fr).toBe("Corps du texte");
    }
  });

  it("accepts valid sourceRegion", () => {
    for (const sourceRegion of ["us", "eu", "middle-east", "asia", "other"]) {
      const result = validateEventInput(validInput({ sourceRegion }));
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.sourceRegion).toBe(sourceRegion);
      }
    }
  });

  it("strips unknown fields from output", () => {
    const result = validateEventInput(
      validInput({ unknownField: "should be stripped" }),
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect("unknownField" in result.data).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// validateEventUpdate
// ---------------------------------------------------------------------------
describe("validateEventUpdate", () => {
  it("rejects non-object input", () => {
    const result = validateEventUpdate(null);
    expect(result.valid).toBe(false);
  });

  it("accepts partial update with only headline", () => {
    const result = validateEventUpdate({ headline: "New Headline" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.headline).toBe("New Headline");
      expect(result.data.body).toBeUndefined();
    }
  });

  it("accepts partial update with only body", () => {
    const result = validateEventUpdate({ body: "Updated body text" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.body).toBe("Updated body text");
    }
  });

  it("rejects empty headline in update", () => {
    const result = validateEventUpdate({ headline: "  " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/headline/);
  });

  it("rejects headline over 500 chars in update", () => {
    const result = validateEventUpdate({ headline: "H".repeat(501) });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/500/);
  });

  it("rejects body over 10000 chars in update", () => {
    const result = validateEventUpdate({ body: "B".repeat(10001) });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/10000/);
  });

  it("rejects invalid category in update", () => {
    const result = validateEventUpdate({ category: "invalid" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/category/);
  });

  it("accepts valid category in update", () => {
    const result = validateEventUpdate({ category: "casualty" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.category).toBe("casualty");
    }
  });

  it("rejects invalid timeET in update", () => {
    const result = validateEventUpdate({ timeET: "14:30" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/timeET/);
  });

  it("accepts slug field in update", () => {
    const result = validateEventUpdate({ slug: "my-custom-slug" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.slug).toBe("my-custom-slug");
    }
  });

  it("accepts empty object (no fields to update)", () => {
    const result = validateEventUpdate({});
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(Object.keys(result.data)).toHaveLength(0);
    }
  });

  it("accepts breaking boolean in update", () => {
    const result = validateEventUpdate({ breaking: false });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.breaking).toBe(false);
    }
  });

  it("accepts status values in update", () => {
    const result = validateEventUpdate({ status: "draft" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.status).toBe("draft");
    }
  });

  it("accepts confidence in update", () => {
    const result = validateEventUpdate({ confidence: "disputed" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.confidence).toBe("disputed");
    }
  });

  it("accepts sourceRegion in update", () => {
    const result = validateEventUpdate({ sourceRegion: "middle-east" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.sourceRegion).toBe("middle-east");
    }
  });

  it("accepts media array in update", () => {
    const result = validateEventUpdate({
      media: [{ fileId: "xyz", type: "video" }],
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.media).toHaveLength(1);
    }
  });

  it("accepts location in update", () => {
    const result = validateEventUpdate({
      location: { lat: 40.7128, lng: -74.006, name: "New York" },
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.location!.name).toBe("New York");
    }
  });

  it("accepts null location in update (clears location)", () => {
    const result = validateEventUpdate({ location: null });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.location).toBeUndefined();
    }
  });

  it("accepts sources array in update", () => {
    const result = validateEventUpdate({
      sources: [{ name: "AP", url: "https://apnews.com" }],
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.sources).toHaveLength(1);
    }
  });

  it("rejects source string over max length in update", () => {
    const result = validateEventUpdate({ source: "S".repeat(201) });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/source/);
  });

  it("rejects sourceUrl string over max length in update", () => {
    const result = validateEventUpdate({
      sourceUrl: "https://x.com/" + "u".repeat(2000),
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/sourceUrl/);
  });
});
