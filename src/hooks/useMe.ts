'use client';

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';

// Returns the current user's Convex profile with linked data
export function useMe() {
  const me = useQuery(api.users.queries.me);
  return {
    user: me ?? null,
    isLoading: me === undefined,
  };
}
