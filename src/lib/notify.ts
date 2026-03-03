import webpush from "web-push";
import crypto from "crypto";
import type { TimelineEvent } from "@/data/timeline";
import { getAllSubscriptions } from "@/lib/push";
import { getRedis } from "@/lib/redis";
import { SITE_URL } from "@/lib/utils";

const PUSH_KEY = "push:subscriptions";

let vapidInitialized = false;

function ensureVapid() {
  if (vapidInitialized) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys not configured, skipping notifications");
    return;
  }
  const host = new URL(SITE_URL).host;
  webpush.setVapidDetails(`mailto:admin@${host}`, publicKey, privateKey);
  vapidInitialized = true;
}

export async function notifySubscribers(event: TimelineEvent): Promise<void> {
  if (event.status === "draft") return;
  ensureVapid();
  if (!vapidInitialized) return;

  const subscribers = await getAllSubscriptions();
  const matching = subscribers.filter((s) =>
    s.categories.includes(event.category),
  );

  const results = await Promise.allSettled(
    matching.map(async (record) => {
      const locale = record.locale || "en";
      const headline =
        locale === "fa" && event.headline_fa
          ? event.headline_fa
          : event.headline;
      const body =
        locale === "fa" && event.body_fa ? event.body_fa : event.body;

      const payload = JSON.stringify({
        title: `${event.category.toUpperCase()}: ${headline}`,
        body: body.length > 120 ? body.slice(0, 117) + "..." : body,
        icon: "/icon-192x192.png",
        tag: event.id,
        url: `/${locale}/events/${event.slug}`,
      });

      try {
        await webpush.sendNotification(record.subscription, payload);
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        if (error.statusCode === 410 || error.statusCode === 404) {
          const hash = crypto
            .createHash("sha256")
            .update(record.subscription.endpoint)
            .digest("hex");
          const redis = getRedis();
          await redis.hdel(PUSH_KEY, hash);
        }
      }
    }),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  console.log(
    `[push] Notified ${sent} subscribers for event ${event.id} (${failed} failed)`,
  );
}
