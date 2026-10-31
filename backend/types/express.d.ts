import 'express';

declare global {
  namespace Express {
    interface Request {
      // Set by verifyToken from the verified access token, never from the request body.
      user?: {
        sub: string;
        email: string;
      };
    }
  }
}
