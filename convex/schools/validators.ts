import { v } from 'convex/values';

// Shared validators for school-related operations
export const schoolSlugValidator = v.string();
export const schoolIdValidator = v.id('schools');
