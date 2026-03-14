import express from 'express';
import {
  addFavourite,
  addWatched,
  addWatchLater,
  clearAllFavourites,
  clearAllWatched,
  clearAllWatchLater,
  deleteWatch,
  getById,
  getFavourites,
  getWatched,
  getWatchLater,
  removeFavourite,
  search,
} from '../controllers/movieControllers';
import { rateLimit } from 'express-rate-limit';
import verifyToken from '../middleware/authMiddleware';
import {
  encryptMiddleware,
  decryptMiddleware,
} from '../middleware/encryptionMiddleware';

const router = express.Router();

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'rate_limiter.error_too_many_requests_search',
});

const movieActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: 'rate_limiter.error_too_many_requests_edit',
});

router.post('/search', searchLimiter, search);
router.post('/getById', getById);

/**
 * Favourite Movies Routes
 */
router.post(
  '/favourite/add',
  movieActionLimiter,
  verifyToken,
  decryptMiddleware,
  addFavourite
);
router.post(
  '/favourite/list',
  movieActionLimiter,
  verifyToken,
  decryptMiddleware,
  getFavourites
);
router.post(
  '/favourite/delete',
  movieActionLimiter,
  verifyToken,
  decryptMiddleware,
  removeFavourite
);
router.post(
  '/favourite/clear',
  movieActionLimiter,
  verifyToken,
  decryptMiddleware,
  clearAllFavourites
);

/**
 * Watch Later Movies Routes
 */
router.post(
  '/watch-later/add',
  movieActionLimiter,
  verifyToken,
  decryptMiddleware,
  addWatchLater
);
router.post(
  '/watch-later/list',
  movieActionLimiter,
  verifyToken,
  decryptMiddleware,
  getWatchLater
);
router.post(
  '/watch-later/clear',
  movieActionLimiter,
  verifyToken,
  decryptMiddleware,
  clearAllWatchLater
);

/**
 * Watched Movies Routes
 */
router.post(
  '/watched/add',
  movieActionLimiter,
  verifyToken,
  decryptMiddleware,
  addWatched
);
router.post(
  '/watched/list',
  movieActionLimiter,
  verifyToken,
  decryptMiddleware,
  getWatched
);
router.post(
  '/watched/clear',
  movieActionLimiter,
  verifyToken,
  decryptMiddleware,
  clearAllWatched
);

/**
 * General Watchlist Actions
 */
router.post(
  '/watch/delete',
  movieActionLimiter,
  verifyToken,
  decryptMiddleware,
  deleteWatch
);

export default router;
