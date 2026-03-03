/**
 * Dispatch a GitHub Actions repository_dispatch event.
 * Uses GITHUB_REPO env var (e.g. "FZ1010/OperationEpicFury") to construct the URL.
 */
export async function dispatchGitHubAction(
  eventType: string,
  clientPayload: Record<string, unknown>,
): Promise<boolean> {
  const ghToken = process.env.GH_PAT;
  if (!ghToken) return false;

  const repo = process.env.GITHUB_REPO;
  if (!repo) {
    console.error("GITHUB_REPO env var is not set");
    return false;
  }
  const url = `https://api.github.com/repos/${repo}/dispatches`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ghToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: eventType,
      client_payload: clientPayload,
    }),
  });

  return res.ok;
}
