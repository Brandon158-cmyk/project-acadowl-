/**
 * Auth route group layout — (auth)/layout.tsx
 *
 * Intentionally a passthrough. The AuthLayout component handles
 * the full-page background and centering; this wrapper just ensures
 * no platform sidebar or topbar is rendered on auth routes.
 */
export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
