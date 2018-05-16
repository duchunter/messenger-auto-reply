'use strict'

import jwt from 'express-jwt';
import jwks from 'jwks-rsa';

// Create auth0Config.js with your own info
import config from './auth0Config';

const authCheck = jwt({
  secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: config.AUTH0_JWKS_URI,
  }),

  audience: config.AUTH0_AUDIENCE,
  issuer: config.AUTH0_ISSUER,
  algorithms: [config.AUTH0_ALGORITHMS]
});

export { authCheck };
