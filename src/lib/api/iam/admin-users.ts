import { iamClient } from '@/lib/api/client';
import { register } from '@/lib/api/iam/auth';
import type { IAMPermission, IAMRole, IAMUser } from './types';
import type {
  AdminUser,
  CreateAdminUserRequest,
  ListAdminUsersParams,
  ListAdminUsersResponse,
  UpdateAdminUserRequest,
  ResetAdminUserPasswordRequest,
} from '@/lib/api/cms/types';

interface ListResponse<T> {
  data: T[];
}

function mapIAMUser(user: IAMUser): AdminUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions ?? [],
    is_active: true,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function applyUserFilters(
  users: IAMUser[],
  params: ListAdminUsersParams
): IAMUser[] {
  let filtered = [...users];

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter((user) => user.email.toLowerCase().includes(q));
  }
  if (params.role) {
    const role = params.role.toLowerCase();
    filtered = filtered.filter((user) => user.role.toLowerCase() === role);
  }
  if (params.is_active === false) {
    // IAM does not expose disable state in Phase 1; no inactive users are returned.
    filtered = [];
  }

  return filtered.sort((a, b) => a.email.localeCompare(b.email));
}

export async function listIAMRoles(): Promise<IAMRole[]> {
  const response =
    await iamClient.get<ListResponse<IAMRole>>('/api/v1/iam/roles');
  return response.data;
}

export async function listIAMPermissions(): Promise<IAMPermission[]> {
  const response = await iamClient.get<ListResponse<IAMPermission>>(
    '/api/v1/iam/permissions'
  );
  return response.data;
}

export async function listAdminUsers(
  params: ListAdminUsersParams = {}
): Promise<ListAdminUsersResponse> {
  const response =
    await iamClient.get<ListResponse<IAMUser>>('/api/v1/iam/users');
  const filtered = applyUserFilters(response.data, params);

  const hasPagination = Boolean(params.page || params.limit);
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit =
    params.limit && params.limit > 0
      ? params.limit
      : Math.max(filtered.length, 1);
  const start = (page - 1) * limit;
  const paged = hasPagination ? filtered.slice(start, start + limit) : filtered;
  const data = paged.map(mapIAMUser);

  return {
    data,
    total: filtered.length,
    page: hasPagination ? page : 1,
    limit,
    total_pages: hasPagination
      ? Math.max(1, Math.ceil(filtered.length / limit))
      : 1,
  };
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  const users = await listAdminUsers({ page: 1, limit: 1000 });
  const user = users.data.find((item) => item.id === id);
  if (!user) {
    throw new Error('Admin user not found');
  }
  return user;
}

export async function createAdminUser(
  data: CreateAdminUserRequest
): Promise<AdminUser> {
  const username = data.email.split('@')[0] || data.email;
  const created = await register({
    username,
    email: data.email,
    password: data.password,
  });

  await iamClient.put('/api/v1/iam/users/' + created.id + '/roles', {
    roles: [data.role],
  });
  if (data.permissions && data.permissions.length > 0) {
    await iamClient.put('/api/v1/iam/users/' + created.id + '/permissions', {
      permissions: data.permissions,
    });
  }

  return getAdminUser(created.id);
}

export async function updateAdminUser(
  id: string,
  data: UpdateAdminUserRequest
): Promise<AdminUser> {
  if (data.role) {
    await iamClient.put('/api/v1/iam/users/' + id + '/roles', {
      roles: [data.role],
    });
  }
  if (data.permissions) {
    await iamClient.put('/api/v1/iam/users/' + id + '/permissions', {
      permissions: data.permissions,
    });
  }
  if (data.email || typeof data.is_active === 'boolean') {
    // Phase 1 IAM APIs do not expose profile or active-state mutation.
    console.warn('IAM Phase 1 ignores email/is_active updates.');
  }

  return getAdminUser(id);
}

export async function deleteAdminUser(id: string): Promise<void> {
  await iamClient.delete('/api/v1/users/' + id);
}

export async function resetAdminUserPassword(
  _id: string,
  _data: ResetAdminUserPasswordRequest
): Promise<void> {
  throw new Error('Password reset is not available in IAM Phase 1 APIs.');
}

export async function updateIAMUserSuspension(
  id: string,
  suspended: boolean
): Promise<void> {
  await iamClient.put('/api/v1/iam/users/' + id + '/suspension', { suspended });
}
