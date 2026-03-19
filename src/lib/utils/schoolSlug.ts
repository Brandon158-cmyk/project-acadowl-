import { headers } from 'next/headers';

// Extract school slug from the x-school-slug header set by middleware
export async function getSchoolSlug(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('x-school-slug');
}

// Extract school slug from hostname (client-side)
export function getSchoolSlugFromHostname(hostname: string): string | null {
  const parts = hostname.split('.');
  const subdomain = parts[0];

  // Skip known non-school subdomains
  const reserved = ['www', 'platform', 'localhost', 'api'];
  if (!subdomain || reserved.includes(subdomain)) return null;

  // Skip localhost with port
  if (subdomain.includes(':')) return null;

  return subdomain;
}
