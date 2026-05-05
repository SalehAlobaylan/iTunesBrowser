import { Loader2, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthCenterBulkActionBarProps {
  count: number;
  busy: boolean;
  onClear: () => void;
  onSetRoles: () => void;
  onSetPermissions: () => void;
}

export function AuthCenterBulkActionBar({
  count,
  busy,
  onClear,
  onSetRoles,
  onSetPermissions,
}: AuthCenterBulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background/95 p-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Button type="button" variant="ghost" size="icon" onClick={onClear} disabled={busy} aria-label="Clear selection">
          <X className="h-4 w-4" />
        </Button>
        {count} selected
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onSetRoles} disabled={busy}>
          <Shield className="mr-2 h-4 w-4" />
          Set role
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onSetPermissions} disabled={busy}>
          Set permissions
        </Button>
      </div>
    </div>
  );
}
