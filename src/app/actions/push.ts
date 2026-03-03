"use server";

import {
  saveSubscription,
  removeSubscription,
  updateSubscriptionCategories,
  getSubscriptionByEndpoint,
  type PushSubscriptionRecord,
} from "@/lib/push";

export async function subscribeUser(
  sub: PushSubscriptionRecord["subscription"],
  categories: string[],
  locale: string,
) {
  await saveSubscription({ subscription: sub, categories, locale });
  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  await removeSubscription(endpoint);
  return { success: true };
}

export async function updateUserCategories(
  endpoint: string,
  categories: string[],
) {
  const ok = await updateSubscriptionCategories(endpoint, categories);
  return { success: ok };
}

export async function getUserSubscription(endpoint: string) {
  const record = await getSubscriptionByEndpoint(endpoint);
  return record;
}
