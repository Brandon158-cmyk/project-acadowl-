'use client';

import { type ReactNode, useEffect } from 'react';
import { useSchool } from '@/hooks/useSchool';

// Applies school-specific branding CSS variables to the document root
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { school } = useSchool();

  useEffect(() => {
    const root = document.documentElement;

    if (school?.branding?.primaryColor) {
      root.style.setProperty('--school-primary', school.branding.primaryColor);
    }
    if (school?.branding?.secondaryColor) {
      root.style.setProperty('--school-secondary', school.branding.secondaryColor);
    }

    return () => {
      root.style.removeProperty('--school-primary');
      root.style.removeProperty('--school-secondary');
    };
  }, [school]);

  return <>{children}</>;
}
