export default {
  providers: [
    {
      // Supabase JWKS endpoint — Convex fetches public keys from here to verify JWTs
      // Domain is set via CONVEX_AUTH_DOMAIN environment variable in Convex dashboard
      // Format: https://xxxx.supabase.co
      domain: process.env.AUTH_DOMAIN!,
      applicationID: 'convex',
    },
  ],
};
