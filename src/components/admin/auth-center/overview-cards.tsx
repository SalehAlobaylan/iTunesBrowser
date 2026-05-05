import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OverviewCardsProps {
  totalUsers: number;
  staffUsers: number;
  appUsers: number;
  permissionedUsers: number;
}

export function OverviewCards({
  totalUsers,
  staffUsers,
  appUsers,
  permissionedUsers,
}: OverviewCardsProps) {
  const items = [
    { label: 'Total Accounts', value: totalUsers },
    { label: 'Console Staff', value: staffUsers },
    { label: 'Wahb App Users', value: appUsers },
    { label: 'Custom Permissions', value: permissionedUsers },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
