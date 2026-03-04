import { type NextRequest, NextResponse } from "next/server";
import { getFileCached, getFileUrl } from "@/lib/telegram";

type Params = { params: Promise<{ fileId: string }> };

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_PREFIXES = ["image/", "video/"];

export async function GET(req: NextRequest, { params }: Params) {
  const { fileId } = await params;
  const isVideo = req.nextUrl.searchParams.get("type") === "video";

  try {
    const filePath = await getFileCached(fileId);
    const url = getFileUrl(filePath);

    // Videos: redirect to Telegram CDN (avoids 4.5MB serverless limit)
    if (isVideo) {
      return NextResponse.redirect(url, {
        headers: {
          "Cache-Control":
            "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    // Photos: stream through proxy with size and content-type checks
    const fileRes = await fetch(url);
    if (!fileRes.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check file size before streaming
    const contentLength = fileRes.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PHOTO_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    let contentType = fileRes.headers.get("content-type") ?? "image/jpeg";
    // Telegram often returns application/octet-stream — infer from file extension
    if (contentType === "application/octet-stream") {
      const ext = filePath.split(".").pop()?.toLowerCase();
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        mp4: "video/mp4",
      };
      contentType = mimeMap[ext ?? ""] ?? "image/jpeg";
    }

    // Validate content type is image or video
    if (
      !ALLOWED_MIME_PREFIXES.some((prefix) => contentType.startsWith(prefix))
    ) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 415 },
      );
    }

    const body = fileRes.body;

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 502 },
    );
  }
}
