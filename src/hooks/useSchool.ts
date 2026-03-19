'use client';

import { useContext } from 'react';
import { SchoolContext } from '@/providers/SchoolProvider';

// Returns the current school context
export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return ctx;
}
