'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGuard prevents rendering of its children if the current user
 * does not have one of the allowed roles.
 */
export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    // Optionally return a subtle loading state, or just null to prevent flash
    return null;
  }

  if (status === 'unauthenticated' || !session?.user) {
    return <>{fallback}</>;
  }

  const userRole = session.user.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
