import { revalidatePath } from "next/cache";

/** Revalidate all locale pages after event changes. */
export function revalidateTimeline(slug?: string) {
  revalidatePath("/en", "page");
  revalidatePath("/fr", "page");
  revalidatePath("/en/archive", "page");
  revalidatePath("/fr/archive", "page");
  revalidatePath("/en/map", "page");
  revalidatePath("/fr/map", "page");
  if (slug) {
    revalidatePath(`/en/events/${slug}`, "page");
    revalidatePath(`/fr/events/${slug}`, "page");
  }
}
