import { getRedis } from "@/lib/redis";

const STATS_KEY = "site:stats";

export interface SiteStats {
  killed: number;
  injured: number;
  usKilled: number;
  israeliKilled: number;
  jets: number;
  targets: number;
  missiles: number;
  countries: number;
}

const DEFAULTS: SiteStats = {
  killed: 555,
  injured: 2000,
  usKilled: 6,
  israeliKilled: 11,
  jets: 200,
  targets: 600,
  missiles: 340,
  countries: 10,
};

export async function getStats(): Promise<SiteStats> {
  const redis = getRedis();
  const raw = await redis.get(STATS_KEY);
  if (!raw) return DEFAULTS;
  return { ...DEFAULTS, ...JSON.parse(raw) };
}

export async function updateStats(stats: Partial<SiteStats>): Promise<SiteStats> {
  const current = await getStats();
  const updated = { ...current, ...stats };
  const redis = getRedis();
  await redis.set(STATS_KEY, JSON.stringify(updated));
  return updated;
}
