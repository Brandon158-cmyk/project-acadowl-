export default {
  providers: [
    {
      type: 'customJwt',
      issuer: process.env.AUTH_DOMAIN!,
      jwks: `${process.env.AUTH_DOMAIN!}/.well-known/jwks.json`,
      algorithm: 'ES256',
      applicationID: 'authenticated',
    },
  ],
};
