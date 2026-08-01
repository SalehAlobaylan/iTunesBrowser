import { operatorVisibleContextSchema } from '@/lib/operator/schemas';
import type { OperatorVisibleContext } from '@/types/platform/operator';

const storageKey = 'wahb-operator-launch-context/v1';

// This short-lived handoff preserves typed page context across navigation. It
// is intentionally browser-local and is revalidated before use; CMS still
// re-reads all operational facts and never treats it as evidence.
export function persistOperatorLaunchContext(context: OperatorVisibleContext) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(storageKey, JSON.stringify(context));
}

export function consumeOperatorLaunchContext(domain?: string, view?: string): OperatorVisibleContext | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = window.sessionStorage.getItem(storageKey);
  window.sessionStorage.removeItem(storageKey);
  if (!raw) return undefined;
  try {
    const parsed = operatorVisibleContextSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || (domain && parsed.data.domain !== domain) || (view && parsed.data.view !== view)) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
}
