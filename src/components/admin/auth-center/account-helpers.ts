import type { AdminUser } from '@/lib/api/cms/types';

export const STAFF_ROLES = new Set(['admin', 'manager', 'agent']);

export type AccountTypeFilter = 'all' | 'staff' | 'app';

export function getAccountType(user: AdminUser): 'staff' | 'app' {
  return STAFF_ROLES.has(user.role.toLowerCase()) ? 'staff' : 'app';
}

export function getPermissionCount(user: AdminUser): number {
  return user.permissions?.length ?? 0;
}

export function getPermissionResource(permission: string): string {
  return permission.split(':')[0] || 'other';
}

export function getPermissionAction(permission: string): string {
  return permission.split(':')[1] || permission;
}

export function groupPermissions(permissions: string[]): Array<{ resource: string; permissions: string[] }> {
  const groups = permissions.reduce<Record<string, string[]>>((acc, permission) => {
    const resource = getPermissionResource(permission);
    acc[resource] = [...(acc[resource] ?? []), permission];
    return acc;
  }, {});

  return Object.entries(groups)
    .map(([resource, items]) => ({
      resource,
      permissions: items.sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.resource.localeCompare(b.resource));
}
