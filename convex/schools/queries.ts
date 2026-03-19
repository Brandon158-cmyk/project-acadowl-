import { v } from 'convex/values';
import { query } from '../_generated/server';

// Get a school by its slug (used for subdomain resolution)
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const school = await ctx.db
      .query('schools')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();

    if (!school || !school.isActive) return null;

    return school;
  },
});

// Get a school by ID
export const getById = query({
  args: { id: v.id('schools') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// List all active schools (platform admin only)
export const listActive = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== 'platform_admin') {
      throw new Error('FORBIDDEN: Only platform admins can list schools');
    }

    return ctx.db
      .query('schools')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();
  },
});

// List ALL schools — active and inactive (platform admin only)
export const listAll = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== 'platform_admin') {
      throw new Error('FORBIDDEN: Only platform admins can list schools');
    }

    return ctx.db.query('schools').collect();
  },
});
