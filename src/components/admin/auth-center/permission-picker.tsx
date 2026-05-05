'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getPermissionAction, groupPermissions } from './account-helpers';

interface PermissionPickerProps {
  permissions: string[];
  selected: string[];
  disabled?: boolean;
  onChange: (permissions: string[]) => void;
}

export function PermissionPicker({
  permissions,
  selected,
  disabled,
  onChange,
}: PermissionPickerProps) {
  const [query, setQuery] = useState('');
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredPermissions = useMemo(() => {
    if (!normalizedQuery) return permissions;
    return permissions.filter((permission) => permission.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, permissions]);

  const groups = useMemo(() => groupPermissions(filteredPermissions), [filteredPermissions]);

  const setPermission = (permission: string, checked: boolean) => {
    const next = new Set(selectedSet);
    if (checked) next.add(permission);
    else next.delete(permission);
    onChange(Array.from(next).sort((a, b) => a.localeCompare(b)));
  };

  const setMany = (items: string[], checked: boolean) => {
    const next = new Set(selectedSet);
    items.forEach((permission) => {
      if (checked) next.add(permission);
      else next.delete(permission);
    });
    onChange(Array.from(next).sort((a, b) => a.localeCompare(b)));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Direct permissions</p>
          <p className="text-xs text-muted-foreground">
            Choose only exceptions to role-based access. Most users should need few or none.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{selected.length} selected</Badge>
          {selected.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])} disabled={disabled}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto rounded-md bg-muted/40 p-2">
          {selected.map((permission) => (
            <button
              key={permission}
              type="button"
              className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              onClick={() => setPermission(permission, false)}
              disabled={disabled}
            >
              {permission}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search permissions by resource or action..."
          className="pl-9"
          disabled={disabled}
        />
      </div>

      <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-md border p-3">
        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No permissions match your search.</p>
        ) : (
          groups.map((group) => {
            const selectedInGroup = group.permissions.filter((permission) => selectedSet.has(permission)).length;
            const allSelected = selectedInGroup === group.permissions.length;
            return (
              <section key={group.resource} className="rounded-md border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold capitalize">{group.resource}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedInGroup} of {group.permissions.length} selected
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMany(group.permissions, !allSelected)}
                    disabled={disabled}
                  >
                    {allSelected ? 'Clear group' : 'Select group'}
                  </Button>
                </div>
                <div className="grid gap-1 p-2 sm:grid-cols-2">
                  {group.permissions.map((permission) => {
                    const checked = selectedSet.has(permission);
                    return (
                      <div
                        key={permission}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                          checked ? 'bg-primary/10 text-foreground' : 'hover:bg-muted',
                          disabled && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => setPermission(permission, Boolean(value))}
                          disabled={disabled}
                          aria-label={`Toggle ${permission}`}
                        />
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setPermission(permission, !checked)}
                          disabled={disabled}
                        >
                          <span className="block truncate font-medium">{getPermissionAction(permission)}</span>
                          <span className="block truncate text-xs text-muted-foreground">{permission}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
