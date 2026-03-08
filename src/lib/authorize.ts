import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";

/**
 * Unified authorization check.
 * Returns true if the request has EITHER:
 * - A valid admin session cookie, OR
 * - A valid Bearer token matching PUBLISH_SECRET
 */
export async function authorize(req?: NextRequest): Promise<boolean> {
  const secret = process.env.PUBLISH_SECRET?.trim();
  if (!secret) return false;

  // Check bearer token auth (used by GitHub Actions / external automation)
  if (req) {
        const authHeader = req.headers.get("authorization");
    if (authHeader === `Bearer ${secret}`) {
      return true;
    }
  }

  // Check cookie-based session auth (used by admin panel)
  return isAuthenticated();
}
