import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { sendMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chat_id, message_id, headline, status, error } =
    await req.json();

  if (status === "success") {
    const siteUrl = process.env.SITE_URL ?? "https://opepicfury.info";
    await sendMessage(
      chat_id,
      `Draft created: *${headline}*\n\nReview: ${siteUrl}/admin`,
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
