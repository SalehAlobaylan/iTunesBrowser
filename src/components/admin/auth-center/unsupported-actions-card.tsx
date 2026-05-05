import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UnsupportedActionsCard() {
  const items = [
    'Suspend/activate account state',
    'Force password reset',
    'Revoke active sessions',
    'Email verification management',
    'Last-login metadata',
    'Security audit trail',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Advanced Actions (Coming Soon)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          These controls are intentionally disabled until IAM exposes dedicated endpoints.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
