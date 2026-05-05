import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminUser } from '@/lib/api/cms/types';
import { getAccountType, getPermissionCount, groupPermissions } from './account-helpers';
import type { UserSortDir, UserSortField } from './use-auth-center-query-state';

interface AuthCenterUsersTableProps {
  users: AdminUser[];
  selectedIds: Set<string>;
  sortField: UserSortField;
  sortDir: UserSortDir;
  onToggleSort: (field: UserSortField) => void;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: (ids: string[], on: boolean) => void;
  onOpenDetails: (user: AdminUser) => void;
  onOpenEdit: (user: AdminUser) => void;
  onOpenDelete: (user: AdminUser) => void;
}

export function AuthCenterUsersTable({
  users,
  selectedIds,
  sortField,
  sortDir,
  onToggleSort,
  onToggleSelection,
  onToggleSelectAll,
  onOpenDetails,
  onOpenEdit,
  onOpenDelete,
}: AuthCenterUsersTableProps) {
  const pageIds = users.map((user) => user.id);
  const selectedCount = pageIds.filter((id) => selectedIds.has(id)).length;
  const headerState =
    selectedCount === 0 ? false : selectedCount === pageIds.length ? true : 'indeterminate';

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={headerState}
                onCheckedChange={(checked) => onToggleSelectAll(pageIds, Boolean(checked))}
                aria-label="Select all users on current page"
              />
            </TableHead>
            <SortableHead label="Email" field="email" sortField={sortField} sortDir={sortDir} onSort={onToggleSort} />
            <SortableHead label="Role" field="role" sortField={sortField} sortDir={sortDir} onSort={onToggleSort} />
            <TableHead>Account Type</TableHead>
            <SortableHead
              label="Permissions"
              field="permissions"
              sortField={sortField}
              sortDir={sortDir}
              onSort={onToggleSort}
            />
            <SortableHead
              label="Created"
              field="created_at"
              sortField={sortField}
              sortDir={sortDir}
              onSort={onToggleSort}
            />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No accounts match these filters.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const accountType = getAccountType(user);
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(user.id)}
                      onCheckedChange={() => onToggleSelection(user.id)}
                      aria-label={`Select ${user.email}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={accountType === 'staff' ? 'default' : 'outline'}>
                      {accountType === 'staff' ? 'Console staff' : 'Wahb app'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <PermissionSummary permissions={user.permissions} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Details" onClick={() => onOpenDetails(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => onOpenEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Delete" onClick={() => onOpenDelete(user)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function PermissionSummary({ permissions }: { permissions: string[] }) {
  if (permissions.length === 0) {
    return <span className="text-sm text-muted-foreground">Role defaults</span>;
  }

  const groups = groupPermissions(permissions);
  const visible = groups.slice(0, 2);
  const remaining = groups.length - visible.length;

  return (
    <div className="flex max-w-[260px] flex-wrap items-center gap-1">
      {visible.map((group) => (
        <Badge key={group.resource} variant="outline" className="capitalize">
          {group.resource} ({group.permissions.length})
        </Badge>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground">+{remaining} more</span>
      )}
    </div>
  );
}

function SortableHead({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string;
  field: UserSortField;
  sortField: UserSortField;
  sortDir: UserSortDir;
  onSort: (field: UserSortField) => void;
}) {
  const active = sortField === field;
  return (
    <TableHead>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-left font-medium"
        onClick={() => onSort(field)}
      >
        <span>{label}</span>
        {active ? sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </TableHead>
  );
}
