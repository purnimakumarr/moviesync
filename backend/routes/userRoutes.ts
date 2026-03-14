import express from 'express';
import {
  createUser,
  updateUser,
  getUser,
  getUserCountry,
} from '../controllers/userControllers';
import rateLimit from 'express-rate-limit';
import verifyToken from '../middleware/authMiddleware';
import {
  decryptMiddleware,
  encryptMiddleware,
} from '../middleware/encryptionMiddleware';
const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'rate_limiter.error_too_many_requests_movie_actions',
});

router.post(
  '/user/create-user',
  authLimiter,
  verifyToken,
  decryptMiddleware,
  encryptMiddleware,
  createUser
);

router.post(
  '/user/get-user',
  authLimiter,
  verifyToken,
  decryptMiddleware,
  encryptMiddleware,
  getUser
);

router.post(
  '/user/update-user',
  authLimiter,
  verifyToken,
  decryptMiddleware,
  encryptMiddleware,
  updateUser
);

router.post('/user/get-country', getUserCountry);

export default router;
