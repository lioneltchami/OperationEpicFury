import { revalidatePath } from "next/cache";

/** Revalidate all locale pages after event changes. */
export function revalidateTimeline() {
  revalidatePath("/en", "page");
  revalidatePath("/fa", "page");
}
