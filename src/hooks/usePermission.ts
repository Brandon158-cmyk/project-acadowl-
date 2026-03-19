'use client';

import { useMe } from './useMe';
import { canDo } from '@/lib/roles/matrix';
import { Permission } from '@/lib/roles/types';

// Check if the current user has a specific permission
export function usePermission(permission: Permission): boolean {
  const { user } = useMe();
  if (!user) return false;
  return canDo(user.role, permission);
}

// Check multiple permissions at once
export function usePermissions(permissions: Permission[]): Record<Permission, boolean> {
  const { user } = useMe();
  const result = {} as Record<Permission, boolean>;
  for (const p of permissions) {
    result[p] = user ? canDo(user.role, p) : false;
  }
  return result;
}
