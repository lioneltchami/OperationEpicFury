import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { sendMessage } from "@/lib/telegram";
import { SITE_URL } from "@/lib/utils";

export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chat_id, message_id, headline, status, error } =
    await req.json();

  if (status === "success") {
    await sendMessage(
      chat_id,
      `Draft created: *${headline}*\n\nReview: ${SITE_URL}/admin`,
      message_id,
    );
  } else {
    await sendMessage(
      chat_id,
      `Failed to process: ${error ?? "unknown error"}`,
      message_id,
    );
  }

  return NextResponse.json({ ok: true });
}
