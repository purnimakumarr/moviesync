import { Request, Response, NextFunction } from 'express';
import {
  encryptAESKey,
  encryptData,
  generateAESKey,
  decryptAESKey,
  decryptData,
} from '../security/encryption';

export const encryptMiddleware = function (
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const originalSend = res.send.bind(res);

  res.send = function (body: any): Response {
    res.send = originalSend;

    // Skip encryption for non-200/201 responses
    if (res.statusCode !== 200 && res.statusCode !== 201) {
      return originalSend(body);
    }

    let parsedBody;
    try {
      parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
      return originalSend(body); // If body isn't JSON, return as is
    }

    const aesKey = generateAESKey();
    const { iv, encryptedData } = encryptData(parsedBody, aesKey);
    const encryptedAESKey = encryptAESKey(aesKey);

    res.setHeader('encrypted-key', encryptedAESKey);
    res.setHeader('Content-Type', 'application/json');

    const encryptedResponse = {
      iv,
      encryptedData,
    };

    return originalSend(JSON.stringify(encryptedResponse));
  };

  next();
};

export const decryptMiddleware = function (
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const encryptedAESKey = req.headers['encrypted-key'] as string;
    const encryptedPayload = req.body;

    if (!encryptedAESKey) {
      res.status(400).json({
        error: 'Missing encrypted key',
      });
      return;
    }

    if (!encryptedPayload) {
      res.status(400).json({
        error: 'Missing payload',
      });
      return;
    }

    const aesKey = decryptAESKey(encryptedAESKey);
    req.body = decryptData(encryptedPayload, aesKey);

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Decryption error',
    });
    return;
  }
};
