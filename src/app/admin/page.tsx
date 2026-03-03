import { getPublishedEvents, getDraftEvents } from "@/lib/kv";
import { AdminDashboard } from "./admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const published = (await getPublishedEvents()).reverse();
  const drafts = (await getDraftEvents()).reverse();

  return <AdminDashboard published={published} drafts={drafts} />;
}
