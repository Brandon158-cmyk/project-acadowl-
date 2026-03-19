'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useAuthFromSupabase() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      const supabase = createSupabaseBrowserClient();
      if (forceRefreshToken) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) return null;
        return data.session.access_token;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    },
    [],
  );

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      fetchAccessToken,
    }),
    [isLoading, isAuthenticated, fetchAccessToken],
  );
}

export function ConvexWithSupabaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromSupabase}>
      {children}
    </ConvexProviderWithAuth>
  );
}
