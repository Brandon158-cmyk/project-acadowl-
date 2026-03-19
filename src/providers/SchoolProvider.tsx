'use client';

import { createContext, type ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Doc } from '@/../convex/_generated/dataModel';

interface SchoolContextValue {
  school: Doc<'schools'> | null;
  isLoading: boolean;
}

export const SchoolContext = createContext<SchoolContextValue | null>(null);

interface SchoolProviderProps {
  slug: string;
  children: ReactNode;
}

// Provides the current school context based on subdomain slug
export function SchoolProvider({ slug, children }: SchoolProviderProps) {
  const school = useQuery(api.schools.queries.getBySlug, { slug });

  return (
    <SchoolContext.Provider
      value={{
        school: school ?? null,
        isLoading: school === undefined,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}
