import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminUser } from '@/lib/api/cms/types';
import { PermissionPicker } from './permission-picker';

type Mode = 'create' | 'edit' | 'delete' | 'bulk-role' | 'bulk-permissions';

interface AccountDialogProps {
  mode: Mode | null;
  busy: boolean;
  roleOptions: string[];
  permissionOptions: string[];
  selectedUser: AdminUser | null;
  formState: {
    email: string;
    password: string;
    role: string;
    permissions: string[];
  };
  selectedCount: number;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (patch: Partial<AccountDialogProps['formState']>) => void;
}

export function AccountDialog({
  mode,
  busy,
  roleOptions,
  permissionOptions,
  selectedUser,
  formState,
  selectedCount,
  onClose,
  onSubmit,
  onFormChange,
}: AccountDialogProps) {
  if (!mode) return null;

  const titleMap: Record<Mode, string> = {
    create: 'Create Account',
    edit: 'Edit Account Access',
    delete: 'Delete Account',
    'bulk-role': 'Apply Role to Selection',
    'bulk-permissions': 'Apply Permissions to Selection',
  };

  const isBulk = mode.startsWith('bulk');
  const showRole = mode === 'create' || mode === 'edit' || mode === 'bulk-role';
  const showPermissions = mode === 'create' || mode === 'edit' || mode === 'bulk-permissions';
  const canUsePresets = mode === 'create' || mode === 'edit' || mode === 'bulk-role';

  const applyPreset = (role: string, permissions: string[] = []) => {
    onFormChange({ role, permissions });
  };

  return (
    <Dialog open={Boolean(mode)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titleMap[mode]}</DialogTitle>
          <DialogDescription>
            {mode === 'delete'
              ? 'This action cannot be undone.'
              : isBulk
                ? `This will apply changes to ${selectedCount} selected account(s).`
                : 'Manage IAM account access for Console and Wahb users.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'delete' ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Delete {selectedUser?.email}?
          </div>
        ) : (
          <div className="space-y-4">
            {mode === 'edit' && selectedUser && (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Editing account</p>
                <p className="mt-1 font-medium">{selectedUser.email}</p>
              </div>
            )}

            {mode === 'create' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Identity</CardTitle>
                  <CardDescription>Basic account details used by IAM login.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="account-email">Email</Label>
                    <Input
                      id="account-email"
                      value={formState.email}
                      onChange={(e) => onFormChange({ email: e.target.value })}
                      placeholder="name@example.com"
                      disabled={busy}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-password">Temporary password</Label>
                    <Input
                      id="account-password"
                      type="password"
                      value={formState.password}
                      onChange={(e) => onFormChange({ password: e.target.value })}
                      placeholder="Minimum 4 characters"
                      disabled={busy}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {canUsePresets && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Access preset</CardTitle>
                  <CardDescription>Start from the common account type, then adjust if needed.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-4">
                  <PresetButton
                    label="Wahb app user"
                    description="Consumer account"
                    active={formState.role === 'user' && formState.permissions.length === 0}
                    disabled={busy || !roleOptions.includes('user')}
                    onClick={() => applyPreset('user', [])}
                  />
                  <PresetButton
                    label="Agent"
                    description="Limited staff"
                    active={formState.role === 'agent'}
                    disabled={busy || !roleOptions.includes('agent')}
                    onClick={() => applyPreset('agent', [])}
                  />
                  <PresetButton
                    label="Manager"
                    description="Team operator"
                    active={formState.role === 'manager'}
                    disabled={busy || !roleOptions.includes('manager')}
                    onClick={() => applyPreset('manager', [])}
                  />
                  <PresetButton
                    label="Admin"
                    description="Full operator"
                    active={formState.role === 'admin'}
                    disabled={busy || !roleOptions.includes('admin')}
                    onClick={() => applyPreset('admin', [])}
                  />
                </CardContent>
              </Card>
            )}

            {showRole && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Role</CardTitle>
                  <CardDescription>Role is the primary access model. Direct permissions are optional exceptions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={formState.role} onValueChange={(value) => onFormChange({ role: value })}>
                    <SelectTrigger id="account-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">Current role: {formState.role}</Badge>
                    {formState.role === 'user' && <span>Best for Wahb Platform consumer accounts.</span>}
                    {formState.role !== 'user' && <span>Staff roles can access operational surfaces when IAM grants them.</span>}
                  </div>
                </CardContent>
              </Card>
            )}

            {showPermissions && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Permission overrides</CardTitle>
                  <CardDescription>
                    {mode === 'bulk-permissions'
                      ? 'This replaces direct permissions for every selected account. Role permissions are not changed.'
                      : 'Grouped by resource so large permission sets stay scannable.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PermissionPicker
                    permissions={permissionOptions}
                    selected={formState.permissions}
                    disabled={busy}
                    onChange={(permissions) => onFormChange({ permissions })}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={mode === 'delete' ? 'destructive' : 'default'} onClick={onSubmit} disabled={busy}>
            {mode === 'delete' ? 'Delete' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PresetButton({
  label,
  description,
  active,
  disabled,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? 'border-primary bg-primary/10' : 'hover:bg-muted'
      }`}
    >
      <span className="block text-sm font-medium">{label}</span>
      <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
    </button>
  );
}
