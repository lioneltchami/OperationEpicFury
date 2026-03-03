export interface NewsSource {
  id: string;
  name: string;
  url: string;
  bias: "left" | "lean-left" | "center" | "lean-right" | "right";
  region: "us" | "eu" | "middle-east" | "asia" | "global";
  reliability: "high" | "medium" | "mixed";
  stateMedia?: boolean;
}

/**
 * Balanced source list — 20 sources across the political spectrum.
 * 4 center/wire, 4 lean-left, 5 lean-right, 7 regional/non-Western.
 *
 * Bias ratings from AllSides / Ad Fontes Media / Media Bias Fact Check consensus.
 * Al Jazeera and Wikipedia excluded per editorial decision.
 */
export const NEWS_SOURCES: NewsSource[] = [
  // ── Center / Wire Services ──
  { id: "reuters", name: "Reuters", url: "https://www.reuters.com/", bias: "center", region: "global", reliability: "high" },
  { id: "ap", name: "Associated Press", url: "https://apnews.com/", bias: "center", region: "global", reliability: "high" },
  { id: "bbc", name: "BBC News", url: "https://www.bbc.com/news", bias: "center", region: "eu", reliability: "high" },
  { id: "al-monitor", name: "Al-Monitor", url: "https://www.al-monitor.com/", bias: "center", region: "middle-east", reliability: "high" },

  // ── Lean Left / Left ──
  { id: "cnn", name: "CNN", url: "https://www.cnn.com/", bias: "lean-left", region: "us", reliability: "medium" },
  { id: "wapo", name: "Washington Post", url: "https://www.washingtonpost.com/", bias: "lean-left", region: "us", reliability: "high" },
  { id: "npr", name: "NPR", url: "https://www.npr.org/", bias: "lean-left", region: "us", reliability: "high" },
  { id: "france24", name: "France 24", url: "https://www.france24.com/en/", bias: "lean-left", region: "eu", reliability: "high" },

  // ── Lean Right / Right ──
  { id: "fox", name: "Fox News", url: "https://www.foxnews.com/category/politics/defense/wars/war-with-iran", bias: "lean-right", region: "us", reliability: "mixed" },
  { id: "wsj", name: "Wall Street Journal", url: "https://www.wsj.com/", bias: "lean-right", region: "us", reliability: "high" },
  { id: "nypost", name: "New York Post", url: "https://nypost.com/", bias: "lean-right", region: "us", reliability: "mixed" },
  { id: "telegraph", name: "Daily Telegraph", url: "https://www.telegraph.co.uk/", bias: "lean-right", region: "eu", reliability: "medium" },
  { id: "toi", name: "Times of Israel", url: "https://www.timesofisrael.com/", bias: "lean-right", region: "middle-east", reliability: "high" },

  // ── Regional / Non-Western ──
  { id: "alarabiya", name: "Al Arabiya", url: "https://english.alarabiya.net/", bias: "center", region: "middle-east", reliability: "medium" },
  { id: "mee", name: "Middle East Eye", url: "https://www.middleeasteye.net/", bias: "lean-left", region: "middle-east", reliability: "medium" },
  { id: "dw", name: "DW", url: "https://www.dw.com/en/", bias: "center", region: "eu", reliability: "high" },
  { id: "nhk", name: "NHK World", url: "https://www3.nhk.or.jp/nhkworld/", bias: "center", region: "asia", reliability: "high" },
  { id: "scmp", name: "SCMP", url: "https://www.scmp.com/", bias: "center", region: "asia", reliability: "medium" },
  { id: "iranintl", name: "Iran International", url: "https://www.iranintl.com/en", bias: "lean-right", region: "middle-east", reliability: "medium" },
  { id: "irna", name: "IRNA", url: "https://en.irna.ir/", bias: "right", region: "middle-east", reliability: "mixed", stateMedia: true },
];

/** Lookup a source by name (case-insensitive fuzzy match). */
export function findSource(name: string): NewsSource | undefined {
  const lower = name.toLowerCase();
  return NEWS_SOURCES.find(
    (s) => s.name.toLowerCase() === lower || s.id === lower,
  );
}
