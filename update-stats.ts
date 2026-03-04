/**
 * Utility script to update site statistics (Killed, Injured, etc.) via the protected API.
 * Usage: npx tsx update-stats.ts --killed 565 --missiles 410
 */

async function updateStats() {
    const secret = process.env.PUBLISH_SECRET;
    const siteUrl = process.env.SITE_URL || "https://operation-epic-fury.vercel.app";

    if (!secret) {
        console.error("Error: PUBLISH_SECRET environment variable is not set.");
        process.exit(1);
    }

    const args = process.argv.slice(2);
    const patch: Record<string, number> = {};

    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("--")) {
            const key = args[i].slice(2);
            const value = parseInt(args[i + 1], 10);
            if (!isNaN(value)) {
                patch[key] = value;
                i++;
            }
        }
    }

    if (Object.keys(patch).length === 0) {
        console.log("Usage: npx tsx update-stats.ts --killed 600 --missiles 400 ...");
        console.log("Allowed keys: killed, injured, usKilled, israeliKilled, jets, targets, missiles, countries");
        process.exit(0);
    }

    console.log(`Updating stats on ${siteUrl}...`);
    console.log("Patch:", patch);

    try {
        const res = await fetch(`${siteUrl}/api/stats`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${secret}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(patch),
        });

        if (res.ok) {
            const data = await res.json();
            console.log("Success! New stats:", data);
        } else {
            const err = await res.text();
            console.error(`Failed to update stats: ${res.status} ${res.statusText}`);
            console.error(err);
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

updateStats();
