import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { migrateToNewStructure } from "@/lib/kv";

export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await migrateToNewStructure();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}
