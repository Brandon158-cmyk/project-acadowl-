'use client';

import { type ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { Permission } from '@/lib/roles/types';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

// Only renders children if the current user has the required permission
export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
