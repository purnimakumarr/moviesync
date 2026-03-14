import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Request, Response, NextFunction } from 'express';

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID!,
  tokenUse: 'access',
  clientId: CLIENT_ID!,
});

const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  try {
    await verifier.verify(token);
    next();
  } catch (error: any) {
    console.error('Token verification error:', error);

    if (error.name === 'TokenExpiredError') {
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
  }
};

export default verifyToken;
