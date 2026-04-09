import jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';

const OAUTH_ISSUER = process.env.OAUTH_ISSUER;
const OAUTH_AUDIENCE = process.env.OAUTH_AUDIENCE;
const OAUTH_JWKS_URI = process.env.OAUTH_JWKS_URI;

const client = new (JwksClient as any)({
  jwksUri: OAUTH_JWKS_URI!,
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
      (err: any, decoded: any) => {
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

        next();
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
