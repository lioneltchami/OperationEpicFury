"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { TimelineEvent } from "@/data/timeline";
import { AdminEventTable } from "./event-table";
import { DashboardStats } from "./dashboard-stats";
import { AdminModal } from "@/components/ui/AdminModal";
import { AdminEventForm } from "@/components/ui/AdminEventForm";
import { PublishPreviewContent } from "./publish-preview-content";

export function AdminDashboard({
  published,
  drafts,
}: {
  published: TimelineEvent[];
  drafts: TimelineEvent[];
}) {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | undefined>();
  const [previewEvent, setPreviewEvent] = useState<TimelineEvent | null>(null);
  const [publishing, setPublishing] = useState(false);

  const openCreate = useCallback(() => {
    setEditingEvent(undefined);
    setModalMode("create");
  }, []);

  const openEdit = useCallback((event: TimelineEvent) => {
    setEditingEvent(event);
    setModalMode("edit");
  }, []);

  const closeModal = useCallback(() => {
    setModalMode(null);
    setEditingEvent(undefined);
  }, []);

  const openPreview = useCallback((event: TimelineEvent) => {
    setPreviewEvent(event);
  }, []);

  const closePreview = useCallback(() => {
    if (!publishing) setPreviewEvent(null);
  }, [publishing]);

  const handlePublish = useCallback(async () => {
    if (!previewEvent) return;
    setPublishing(true);
    await fetch(`/api/events/${previewEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    setPublishing(false);
    setPreviewEvent(null);
    router.refresh();
  }, [previewEvent, router]);

  return (
    <>
      <div className="space-y-6">
        {/* Stats cards */}
        <DashboardStats
          publishedCount={published.length}
          draftCount={drafts.length}
          breakingCount={published.filter((e) => e.breaking).length}
        />

        {/* Drafts section */}
        {drafts.length > 0 && (
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                </span>
                <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                  Drafts
                </h2>
              </div>
              <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full">
                {drafts.length}
              </span>
            </div>
            <AdminEventTable
              events={drafts}
              isDraftSection
              onEdit={openEdit}
              onPreview={openPreview}
            />
          </section>
        )}

        {/* Published section */}
        <section
          className="animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                Published
              </h2>
              <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full">
                {published.length}
              </span>
            </div>
            <button
              onClick={openCreate}
              className="
                flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                bg-red-600 text-white rounded-lg
                hover:bg-red-500 active:bg-red-700
                transition-all duration-150
                shadow-lg shadow-red-600/20
              "
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add Event
            </button>
          </div>
          <AdminEventTable events={published} onEdit={openEdit} />
        </section>
      </div>

      {/* Modal for Create / Edit */}
      <AdminModal
        open={modalMode !== null}
        onClose={closeModal}
        title={modalMode === "create" ? "New Event" : "Edit Event"}
      >
        {/* Key forces React to remount the form when switching events */}
        <AdminEventForm
          key={editingEvent?.id ?? "new"}
          event={editingEvent}
          mode={modalMode === "edit" ? "edit" : "create"}
          onSaved={closeModal}
          onCancel={closeModal}
        />
      </AdminModal>

      {/* Modal for Publish Preview */}
      <AdminModal
        open={previewEvent !== null}
        onClose={closePreview}
        title="Publish Preview"
      >
        {previewEvent && (
          <PublishPreviewContent
            event={previewEvent}
            publishing={publishing}
            onPublish={handlePublish}
            onCancel={closePreview}
          />
        )}
      </AdminModal>
    </>
  );
}
