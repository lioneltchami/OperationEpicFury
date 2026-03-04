#!/bin/bash

# This script closes all issues with the 'pending-review' label as 'completed',
# which triggers the 'Approve/Reject News Event' GitHub Action to publish them.

echo "Fetching pending news issues..."
ISSUES=$(gh issue list --label "pending-review" --limit 100 --json number -q '.[].number')

if [ -z "$ISSUES" ]; then
  echo "No pending-review issues found."
  exit 0
fi

COUNT=$(echo "$ISSUES" | wc -l | xargs)
echo "Found $COUNT issues to approve."

for ISSUE in $ISSUES; do
  echo "Approving Issue #$ISSUE..."
  gh issue close "$ISSUE" --reason completed
  # Optional: Sleep a bit to avoid hitting GitHub API rate limits
  sleep 1
done

echo "All issues have been closed and triggered for publishing."
echo "Wait a few minutes for the GitHub Actions to complete."
