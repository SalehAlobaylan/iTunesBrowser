import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AdminUser } from '@/lib/api/cms/types';
import { getPermissionAction, groupPermissions } from './account-helpers';

interface AccountDetailDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountDetailDialog({ user, open, onOpenChange }: AccountDetailDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Account Details</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="space-y-3">
            <Field label="User ID" value={user.id} />
            <Field label="Role" value={user.role} />
            <Field label="Created" value={new Date(user.created_at).toLocaleString()} />
            <Field label="Updated" value={new Date(user.updated_at).toLocaleString()} />
          </TabsContent>
          <TabsContent value="access" className="space-y-3">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Permission overrides</p>
                <p className="text-sm text-muted-foreground">
                  These are direct IAM permissions assigned beyond the user role.
                </p>
              </div>
              {user.permissions.length > 0 ? (
                <div className="space-y-3">
                  {groupPermissions(user.permissions).map((group) => (
                    <div key={group.resource} className="rounded-md border">
                      <div className="flex items-center justify-between border-b px-3 py-2">
                        <p className="text-sm font-medium capitalize">{group.resource}</p>
                        <Badge variant="outline">{group.permissions.length}</Badge>
                      </div>
                      <div className="grid gap-2 p-3 sm:grid-cols-2">
                        {group.permissions.map((permission) => (
                          <div key={permission} className="rounded-md bg-muted/40 px-3 py-2">
                            <p className="text-sm font-medium">{getPermissionAction(permission)}</p>
                            <p className="text-xs text-muted-foreground">{permission}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No direct permission overrides. This account relies on its role defaults.
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="security" className="space-y-3">
            <UnavailableItem title="Session revocation" description="Requires IAM session list and revoke endpoints." />
            <UnavailableItem title="Force password reset" description="Requires IAM admin password reset endpoint." />
            <UnavailableItem title="Email verification controls" description="Requires IAM verification management APIs." />
            <UnavailableItem title="Audit activity timeline" description="Requires IAM audit event APIs." />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function UnavailableItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-dashed p-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
