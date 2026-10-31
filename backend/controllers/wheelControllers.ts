import { Request, Response } from 'express';
import * as crypto from 'crypto';
import pool from '../db';
import { embedQuery } from '../services/embeddings';
import { movieFromCacheRow } from '../services/movieCache';
import { buildTasteProfile, scoreMovie, weightedSample } from '../services/tasteProfile';
import { queryWheelCandidates } from '../services/wheelCandidates';

const MAX_MOOD_LENGTH = 200;
const MAX_PICKS = 10;
// Mood search keeps the closest few times as many titles as picks, so the
// wheel still varies between spins instead of always showing the top match.
const MOOD_POOL_FACTOR = 3;
const MIN_MOOD_POOL = 9;
// Candidates considered by Smart Spin when there is no mood.
const SMART_POOL_SIZE = 100;

const parseMood = (mood: unknown) =>
  typeof mood === 'string' ? mood.trim().slice(0, MAX_MOOD_LENGTH) : '';

const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  Math.min(Math.max(Number(value) || fallback, min), max);

// A failed model load must not break the wheel: fall back to random picks.
const tryEmbedMood = async (mood: string) => {
  if (!mood) return null;
  try {
    return await embedQuery(mood);
  } catch (error) {
    console.error('Mood embedding failed, using random candidates:', error);
    return null;
  }
};

const moodReason = (mood: string) => `Close match to "${mood}"`;

export const getWheelCandidates = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { limit = 24, mood } = req.body;
    const moodText = parseMood(mood);
    const queryEmbedding = await tryEmbedMood(moodText);

    const rows = await queryWheelCandidates(req.body, {
      limit: clamp(limit, 1, 50, 24),
      queryEmbedding,
    });

    res.status(200).json({
      success: true,
      moodApplied: Boolean(queryEmbedding),
      movies: rows.map((row) => ({
        ...movieFromCacheRow(row),
        ...(queryEmbedding
          ? { similarity: row.similarity, reasons: [moodReason(moodText)] }
          : {}),
      })),
    });
  } catch (error) {
    console.error('Error fetching wheel candidates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getSmartPicks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userID = req.user?.email;

  if (!userID) {
    res.status(400).json({ error: 'User id is required' });
    return;
  }

  try {
    const { count = 3, mood, excludeWatched = true } = req.body;
    const pickCount = clamp(count, 1, MAX_PICKS, 3);
    const moodText = parseMood(mood);
    const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

    const saved = await pool.query(
      `
        SELECT 'favourite' AS list, f.tmdb_id AS id, f.media_type,
               mc.genre, mc.director, mc.actors
        FROM favourites_yn085 f
        LEFT JOIN movie_cache mc
          ON mc.media_type = f.media_type AND mc.tmdb_id = f.tmdb_id
        WHERE f.user_id = $1
        UNION ALL
        SELECT um.status AS list, um.tmdb_id AS id, um.media_type,
               mc.genre, mc.director, mc.actors
        FROM user_movies_yn085 um
        LEFT JOIN movie_cache mc
          ON mc.media_type = um.media_type AND mc.tmdb_id = um.tmdb_id
        WHERE um.user_id = $1
      `,
      [userIDHash],
    );

    const watched = saved.rows.filter((row) => row.list === 'watched');
    const requestedExcludes = Array.isArray(req.body.exclude)
      ? req.body.exclude
      : [];

    const queryEmbedding = await tryEmbedMood(moodText);
    const candidates = await queryWheelCandidates(
      {
        ...req.body,
        exclude: [...requestedExcludes, ...(excludeWatched ? watched : [])],
      },
      {
        limit: queryEmbedding
          ? Math.max(pickCount * MOOD_POOL_FACTOR, MIN_MOOD_POOL)
          : SMART_POOL_SIZE,
        queryEmbedding,
      },
    );

    const profile = buildTasteProfile(saved.rows);
    const scored = candidates.map((row) => scoreMovie(profile, row));
    const picks = weightedSample(
      scored,
      scored.map((entry) => entry.score),
      pickCount,
    );

    res.status(200).json({
      success: true,
      moodApplied: Boolean(queryEmbedding),
      movies: picks.map(({ movie, reason }) => ({
        ...movieFromCacheRow(movie),
        reasons: [
          ...(queryEmbedding ? [moodReason(moodText)] : []),
          ...(reason ? [reason] : []),
        ],
      })),
    });
  } catch (error) {
    console.error('Error fetching smart picks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
