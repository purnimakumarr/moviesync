import jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';

const OAUTH_ISSUER = process.env.OAUTH_ISSUER;
const OAUTH_AUDIENCE = process.env.OAUTH_AUDIENCE;
const OAUTH_JWKS_URI = process.env.OAUTH_JWKS_URI;
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID;

const client = new (JwksClient as any)({
  jwksUri: OAUTH_JWKS_URI,
});

const getKey = (header: any, callback: (err: any, key?: string) => void) => {
  client.getSigningKey(header.kid, (err: any, key: any) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.publicKey || key?.rsaPublicKey;
    callback(null, signingKey);
  });
};

const verifyIdToken = (idToken: string): Promise<any> =>
  new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: OAUTH_ISSUER,
        audience: OAUTH_CLIENT_ID,
        // The access token already enforces session freshness. The ID token is
        // only used as a signed statement of which email belongs to this sub.
        ignoreExpiration: true,
      },
      (err: any, decoded: any) => (err ? reject(err) : resolve(decoded)),
    );
  });

// Existing rows are keyed by sha256(email), so the email has to come from a
// trusted source. Prefer an email claim on the access token, otherwise use the
// signed ID token the browser sends, as long as it belongs to the same user.
const resolveEmail = async (
  decodedAccessToken: any,
  idToken: string | undefined,
): Promise<string | null> => {
  const claimKey = Object.keys(decodedAccessToken).find(
    (key) => key === 'email' || key.endsWith('/email'),
  );
  if (claimKey && typeof decodedAccessToken[claimKey] === 'string') {
    return decodedAccessToken[claimKey];
  }

  if (!idToken) return null;

  const decodedIdToken = await verifyIdToken(idToken);
  if (decodedIdToken.sub !== decodedAccessToken.sub) return null;

  const email = decodedIdToken.email;
  return typeof email === 'string' && email ? email : null;
};

const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  try {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: OAUTH_ISSUER,
        audience: OAUTH_AUDIENCE,
      },
      async (err: any, decoded: any) => {
        if (err) {
          console.error('Token verification error:', err);

          if (err.name === 'TokenExpiredError') {
            res.status(401).json({
              success: false,
              error: 'Token has expired',
            });
            return;
          }

          res.status(401).json({
            success: false,
            error: 'Invalid or unauthorized token',
          });
          return;
        }

        try {
          const idToken = req.headers['x-id-token'] as string | undefined;
          const email = await resolveEmail(decoded, idToken);
          if (!email) {
            res.status(401).json({
              success: false,
              error: 'Unable to resolve user identity',
            });
            return;
          }

          req.user = { sub: decoded.sub, email };
          next();
        } catch (identityError) {
          console.error('User identity lookup error:', identityError);
          res.status(401).json({
            success: false,
            error: 'Unable to resolve user identity',
          });
        }
      },
    );
  } catch (error: any) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or unauthorized token',
    });
  }
};

export default verifyToken;
