// Executable target identity is exclusively CMS-owned. Route subjects and
// browser selections are investigation context and are intentionally absent
// from this function's input.
export function eligibleActionTargetIDs(action?: { target_ids: readonly string[]; manual_only: boolean }): string[] {
  if (!action || action.manual_only || action.target_ids.length !== 1) return [];
  return [...action.target_ids];
}
