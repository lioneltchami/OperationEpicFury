import Redis from "ioredis";

async function run() {
    const url = process.env.KV_REDIS_URL;
    if (!url) return;

    const tlsUrl = url.replace("redis://", "rediss://");
    const redis = new Redis(tlsUrl, {
        maxRetriesPerRequest: 0,
        connectTimeout: 5000,
        tls: { rejectUnauthorized: false }
    });

    try {
        const allEventsRaw = await redis.hgetall("events:data");
        const ids = Object.keys(allEventsRaw);
        console.log(`Total events in hash: ${ids.length}`);

        const events = ids.map(id => JSON.parse(allEventsRaw[id]));

        const published = events.filter(e => e.status === "published" || !e.status);
        const drafts = events.filter(e => e.status === "draft");

        console.log(`Published: ${published.length}`);
        console.log(`Drafts: ${drafts.length}`);

        if (drafts.length > 0) {
            console.log("\nDraft Headlines:");
            drafts.forEach(d => console.log(`- ${d.headline} (${d.timeET})`));
        }

        const indexIds = await redis.zrange("events:index", 0, -1);
        console.log(`\nEvents in index (zset): ${indexIds.length}`);

        const missingFromIndex = ids.filter(id => !indexIds.includes(id));
        if (missingFromIndex.length > 0) {
            console.log(`\nWARNING: ${missingFromIndex.length} events are in hash but NOT in index!`);
        }

    } catch (err: any) {
        console.error("Audit failed:", err.message);
    } finally {
        redis.disconnect();
    }
}

run();
