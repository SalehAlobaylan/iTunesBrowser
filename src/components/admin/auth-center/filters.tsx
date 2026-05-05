import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AccountTypeFilter } from './account-helpers';

interface AuthCenterFiltersProps {
  search: string;
  role: string;
  accountType: AccountTypeFilter;
  permission: string;
  roleOptions: string[];
  permissionOptions: string[];
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onAccountTypeChange: (value: AccountTypeFilter) => void;
  onPermissionChange: (value: string) => void;
}

export function AuthCenterFilters({
  search,
  role,
  accountType,
  permission,
  roleOptions,
  permissionOptions,
  onSearchChange,
  onRoleChange,
  onAccountTypeChange,
  onPermissionChange,
}: AuthCenterFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      <div className="relative lg:col-span-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={role} onValueChange={onRoleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          {roleOptions.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={accountType} onValueChange={(value) => onAccountTypeChange(value as AccountTypeFilter)}>
        <SelectTrigger>
          <SelectValue placeholder="Account type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All account types</SelectItem>
          <SelectItem value="staff">Console staff</SelectItem>
          <SelectItem value="app">Wahb app users</SelectItem>
        </SelectContent>
      </Select>
      <Select value={permission} onValueChange={onPermissionChange}>
        <SelectTrigger className="lg:col-span-2">
          <SelectValue placeholder="Permission" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any permission</SelectItem>
          {permissionOptions.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
