import { Request, Response } from 'express';
import * as crypto from 'crypto';
import pool from '../db';
import { embedQuery } from '../services/embeddings';
import { buildTasteProfile, scoreMovie, TasteProfile, weightedSample } from '../services/tasteProfile';
import { getDetails, MediaType, summarise, TmdbTitle } from '../services/tmdb';
import {
  fetchWheelCandidates,
  MOOD_POOL_SIZE,
  rankByMood,
  WheelFilters,
} from '../services/wheelCandidates';

const MAX_MOOD_LENGTH = 200;
const MAX_PICKS = 10;
// Mood search keeps the closest few times as many titles as picks, so the
// wheel still varies between spins instead of always showing the top match.
const MOOD_POOL_FACTOR = 3;
const MIN_MOOD_POOL = 9;
// Candidates considered by Smart Spin when there is no mood.
const SMART_POOL_SIZE = 100;
// List results have no credits, so only this many candidates, drawn by genre
// match, get a details request for director and actor scoring.
const SMART_SHORTLIST_SIZE = 20;

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

const findCandidates = async (
  filters: WheelFilters,
  moodText: string,
  { limit, moodLimit }: { limit: number; moodLimit: number },
): Promise<{ titles: TmdbTitle[]; moodApplied: boolean }> => {
  const queryEmbedding = await tryEmbedMood(moodText);
  if (!queryEmbedding) {
    return { titles: await fetchWheelCandidates(filters, { limit }), moodApplied: false };
  }

  const moodPool = await fetchWheelCandidates(filters, { limit: MOOD_POOL_SIZE, mood: moodText });
  try {
    return { titles: await rankByMood(moodPool, queryEmbedding, moodLimit), moodApplied: true };
  } catch (error) {
    console.error('Embedding candidates failed, ignoring the mood:', error);
    return { titles: moodPool.slice(0, limit), moodApplied: false };
  }
};

export const getWheelCandidates = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { limit = 24, mood } = req.body;
    const moodText = parseMood(mood);
    const candidateLimit = clamp(limit, 1, 50, 24);

    const { titles, moodApplied } = await findCandidates(req.body, moodText, {
      limit: candidateLimit,
      moodLimit: candidateLimit,
    });

    res.status(200).json({
      success: true,
      moodApplied,
      movies: titles.map((title) => ({
        ...title,
        ...(moodApplied ? { reasons: [moodReason(moodText)] } : {}),
      })),
    });
  } catch (error) {
    console.error('Error fetching wheel candidates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const tryGetDetails = async (mediaType: MediaType, id: number) => {
  try {
    return await getDetails(mediaType, id);
  } catch (error) {
    console.error(`Error fetching details for ${mediaType} ${id}:`, error);
    return null;
  }
};

type SavedRow = { list: 'favourite' | 'watched' | 'watch_later'; id: number; media_type: MediaType };

const titleKey = ({ media_type, id }: { media_type: MediaType; id: number }) => `${media_type}-${id}`;

// A title on two lists is fetched once but counts for both. Titles TMDB
// cannot return right now are left out of the profile.
const buildLiveTasteProfile = async (rows: SavedRow[]) => {
  const distinct = new Map(rows.map((row) => [titleKey(row), row]));
  const details = new Map(
    await Promise.all(
      Array.from(distinct, async ([key, row]) =>
        [key, await tryGetDetails(row.media_type, row.id)] as const,
      ),
    ),
  );

  return buildTasteProfile(
    rows.flatMap((row) => {
      const title = details.get(titleKey(row));
      return title ? [{ list: row.list, ...summarise(title) }] : [];
    }),
  );
};

const scoreTitle = (profile: TasteProfile, title: TmdbTitle) =>
  scoreMovie(profile, { ...summarise(title), details: title });

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

    const saved = await pool.query<SavedRow>(
      `
        SELECT 'favourite' AS list, tmdb_id AS id, media_type
        FROM favourites_yn085
        WHERE user_id = $1
        UNION ALL
        SELECT status AS list, tmdb_id AS id, media_type
        FROM user_movies_yn085
        WHERE user_id = $1
      `,
      [userIDHash],
    );

    const watched = saved.rows.filter((row) => row.list === 'watched');
    const requestedExcludes = Array.isArray(req.body.exclude)
      ? req.body.exclude
      : [];

    const [{ titles, moodApplied }, profile] = await Promise.all([
      findCandidates(
        {
          ...req.body,
          exclude: [...requestedExcludes, ...(excludeWatched ? watched : [])],
        },
        moodText,
        {
          limit: SMART_POOL_SIZE,
          moodLimit: Math.max(pickCount * MOOD_POOL_FACTOR, MIN_MOOD_POOL),
        },
      ),
      buildLiveTasteProfile(saved.rows),
    ]);

    const byGenre = titles.map((title) => scoreTitle(profile, title));
    const shortlist = weightedSample(
      byGenre,
      byGenre.map((entry) => entry.score),
      SMART_SHORTLIST_SIZE,
    );

    // If a details request fails the title stays in, scored on genres alone.
    const scored = await Promise.all(
      shortlist.map(async ({ movie: { details } }) =>
        scoreTitle(
          profile,
          (await tryGetDetails(details.media_type, details.id)) ?? details,
        ),
      ),
    );
    const picks = weightedSample(
      scored,
      scored.map((entry) => entry.score),
      pickCount,
    );

    res.status(200).json({
      success: true,
      moodApplied,
      movies: picks.map(({ movie, reason }) => ({
        ...movie.details,
        reasons: [
          ...(moodApplied ? [moodReason(moodText)] : []),
          ...(reason ? [reason] : []),
        ],
      })),
    });
  } catch (error) {
    console.error('Error fetching smart picks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
