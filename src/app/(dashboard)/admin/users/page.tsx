'use client';

import { useMemo, useState } from 'react';
import { Plus, ShieldX, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageSkeleton } from '@/components/shared/loading-state';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from '@/components/ui/toast';
import type { AdminUser } from '@/lib/api/cms/types';
import { useAuth } from '@/hooks/use-auth';
import {
  useAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
  useIAMPermissions,
  useIAMRoles,
  useUpdateAdminUser,
} from '@/hooks/use-admin-users';
import { AccountDialog } from '@/components/admin/auth-center/account-dialog';
import { AccountDetailDialog } from '@/components/admin/auth-center/account-detail-dialog';
import { AuthCenterBulkActionBar } from '@/components/admin/auth-center/bulk-action-bar';
import { AuthCenterFilters } from '@/components/admin/auth-center/filters';
import { OverviewCards } from '@/components/admin/auth-center/overview-cards';
import { UnsupportedActionsCard } from '@/components/admin/auth-center/unsupported-actions-card';
import { AuthCenterUsersTable } from '@/components/admin/auth-center/users-table';
import { getAccountType, getPermissionCount } from '@/components/admin/auth-center/account-helpers';
import { useAuthCenterQueryState } from '@/components/admin/auth-center/use-auth-center-query-state';

type DialogMode = 'create' | 'edit' | 'delete' | 'bulk-role' | 'bulk-permissions';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const shouldFetch = Boolean(user && user.role === 'admin');
  const { state, setState, toggleSort } = useAuthCenterQueryState();
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    role: 'user',
    permissions: [] as string[],
  });

  const { data, isLoading, error } = useAdminUsers({ enabled: shouldFetch });
  const { data: iamRoles } = useIAMRoles();
  const { data: iamPermissions } = useIAMPermissions();

  const createMutation = useCreateAdminUser();
  const updateMutation = useUpdateAdminUser();
  const deleteMutation = useDeleteAdminUser();
  const isBusy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const roleOptions = useMemo(() => (iamRoles?.map((role) => role.name) ?? ['admin', 'manager', 'agent', 'user']), [iamRoles]);
  const permissionOptions = useMemo(() => (iamPermissions?.map((permission) => permission.key) ?? []), [iamPermissions]);

  const filtered = useMemo(() => {
    const users = data?.data ?? [];
    return users
      .filter((item) => {
        if (state.search && !item.email.toLowerCase().includes(state.search.toLowerCase())) return false;
        if (state.role !== 'all' && item.role !== state.role) return false;
        if (state.accountType !== 'all' && getAccountType(item) !== state.accountType) return false;
        if (state.permission !== 'all' && !item.permissions.includes(state.permission)) return false;
        return true;
      })
      .sort((a, b) => {
        const factor = state.sortDir === 'asc' ? 1 : -1;
        switch (state.sortField) {
          case 'email':
            return a.email.localeCompare(b.email) * factor;
          case 'role':
            return a.role.localeCompare(b.role) * factor;
          case 'permissions':
            return (getPermissionCount(a) - getPermissionCount(b)) * factor;
          case 'created_at':
          default:
            return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * factor;
        }
      });
  }, [data?.data, state]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(state.page, totalPages);
  const pagedUsers = filtered.slice((page - 1) * pageSize, page * pageSize);

  const overview = useMemo(() => {
    const allUsers = data?.data ?? [];
    return {
      totalUsers: allUsers.length,
      staffUsers: allUsers.filter((item) => getAccountType(item) === 'staff').length,
      appUsers: allUsers.filter((item) => getAccountType(item) === 'app').length,
      permissionedUsers: allUsers.filter((item) => getPermissionCount(item) > 0).length,
    };
  }, [data?.data]);

  const openCreate = () => {
    setSelectedUser(null);
    setFormState({ email: '', password: '', role: 'user', permissions: [] });
    setDialogMode('create');
  };

  const openEdit = (target: AdminUser) => {
    setSelectedUser(target);
    setFormState({ email: target.email, password: '', role: target.role, permissions: target.permissions });
    setDialogMode('edit');
  };

  const openBulkRole = () => {
    setSelectedUser(null);
    setFormState({ email: '', password: '', role: 'user', permissions: [] });
    setDialogMode('bulk-role');
  };

  const openBulkPermissions = () => {
    setSelectedUser(null);
    setFormState({ email: '', password: '', role: 'user', permissions: [] });
    setDialogMode('bulk-permissions');
  };

  const handleSubmit = async () => {
    if (!dialogMode) return;

    if (dialogMode === 'create') {
      const email = formState.email.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast({ title: 'Invalid email', description: 'Enter a valid email address.', variant: 'destructive' });
        return;
      }
      if (formState.password.length < 4) {
        toast({ title: 'Invalid password', description: 'Password must be at least 4 characters.', variant: 'destructive' });
        return;
      }
      createMutation.mutate(
        { email, password: formState.password, role: formState.role, permissions: formState.permissions },
        { onSuccess: () => setDialogMode(null) }
      );
      return;
    }

    if (dialogMode === 'edit' && selectedUser) {
      updateMutation.mutate(
        { id: selectedUser.id, data: { role: formState.role, permissions: formState.permissions } },
        { onSuccess: () => setDialogMode(null) }
      );
      return;
    }

    if (dialogMode === 'delete' && selectedUser) {
      if (selectedUser.id === user?.id) {
        toast({
          title: 'Action blocked',
          description: 'You cannot delete the account that is currently signed in.',
          variant: 'destructive',
        });
        return;
      }
      deleteMutation.mutate(selectedUser.id, { onSuccess: () => setDialogMode(null) });
      return;
    }

    if (dialogMode === 'bulk-role' || dialogMode === 'bulk-permissions') {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      await Promise.all(
        ids.map((id) =>
          updateMutation.mutateAsync({
            id,
            data: dialogMode === 'bulk-role' ? { role: formState.role } : { permissions: formState.permissions },
          })
        )
      );
      setSelectedIds(new Set());
      setDialogMode(null);
      toast({ title: 'Bulk update complete', description: `Updated ${ids.length} account(s).`, variant: 'success' });
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (!user || user.role !== 'admin') {
    return <EmptyState icon={ShieldX} title="Permission denied" description="You do not have access to Auth Center." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auth Center</h1>
          <p className="text-muted-foreground">Manage all IAM tenant accounts for Console and Wahb Platform.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Account
        </Button>
      </div>

      <OverviewCards {...overview} />

      <AuthCenterFilters
        search={state.search}
        role={state.role}
        accountType={state.accountType}
        permission={state.permission}
        roleOptions={roleOptions}
        permissionOptions={permissionOptions}
        onSearchChange={(value) => setState({ search: value })}
        onRoleChange={(value) => setState({ role: value })}
        onAccountTypeChange={(value) => setState({ accountType: value })}
        onPermissionChange={(value) => setState({ permission: value })}
      />

      <AuthCenterBulkActionBar
        count={selectedIds.size}
        busy={isBusy}
        onClear={() => setSelectedIds(new Set())}
        onSetRoles={openBulkRole}
        onSetPermissions={openBulkPermissions}
      />

      {error ? (
        <div className="rounded-md border p-8 text-center text-destructive">Failed to load IAM users. Please try again.</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No matching accounts"
          description="Adjust filters or create a new IAM account."
          action={{ label: 'Create Account', onClick: openCreate }}
        />
      ) : (
        <>
          <AuthCenterUsersTable
            users={pagedUsers}
            selectedIds={selectedIds}
            sortField={state.sortField}
            sortDir={state.sortDir}
            onToggleSort={toggleSort}
            onToggleSelection={(id) =>
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            onToggleSelectAll={(ids, on) =>
              setSelectedIds((prev) => {
                const next = new Set(prev);
                ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
                return next;
              })
            }
            onOpenDetails={(target) => setDetailUser(target)}
            onOpenEdit={openEdit}
            onOpenDelete={(target) => {
              setSelectedUser(target);
              setDialogMode('delete');
            }}
          />
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setState({ page: Math.max(1, page - 1) })}
                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink onClick={() => setState({ page: p })} isActive={p === page} className="cursor-pointer">
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setState({ page: Math.min(totalPages, page + 1) })}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <UnsupportedActionsCard />

      <AccountDialog
        mode={dialogMode}
        busy={isBusy}
        roleOptions={roleOptions}
        permissionOptions={permissionOptions}
        selectedUser={selectedUser}
        formState={formState}
        selectedCount={selectedIds.size}
        onClose={() => setDialogMode(null)}
        onSubmit={handleSubmit}
        onFormChange={(patch) => setFormState((prev) => ({ ...prev, ...patch }))}
      />
      <AccountDetailDialog user={detailUser} open={Boolean(detailUser)} onOpenChange={(open) => !open && setDetailUser(null)} />
    </div>
  );
}
