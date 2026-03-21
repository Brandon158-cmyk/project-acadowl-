'use client';

import { createContext, type ReactNode, useMemo } from 'react';
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
  const normalizedSchool = useMemo(() => {
    if (!school) {
      return null;
    }

    return {
      ...school,
      branding: school.branding
        ? {
            ...school.branding,
            logoUrl: school.branding.logoUrl ?? undefined,
            primaryColor: school.branding.primaryColor ?? undefined,
            secondaryColor: school.branding.secondaryColor ?? undefined,
          }
        : undefined,
      enabledFeatures: school.enabledFeatures ?? [],
      smsTemplates: school.smsTemplates
        ? {
            ...school.smsTemplates,
            absenceAlert: school.smsTemplates.absenceAlert ?? undefined,
            attendanceBroadcast: school.smsTemplates.attendanceBroadcast ?? undefined,
            academicYearActivated: school.smsTemplates.academicYearActivated ?? undefined,
          }
        : undefined,
    } satisfies Doc<'schools'>;
  }, [school]);

  const value = useMemo(
    () => ({
      school: normalizedSchool,
      isLoading: school === undefined,
    }),
    [normalizedSchool, school],
  );

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
}
