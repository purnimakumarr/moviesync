import pool from '../db';
import { MovieCacheRow } from './movieCache';
import { toSqlVector } from './embeddings';

export type WheelFilters = {
  genres?: unknown;
  type?: unknown;
  fromYear?: unknown;
  toYear?: unknown;
  exclude?: unknown;
};

// "movie-550": one string per title, matching the frontend's movieKey.
export const titleKeys = (titles: unknown) =>
  Array.isArray(titles)
    ? titles
        .filter((title) => title && typeof title === 'object')
        .map(({ media_type, id }) => `${media_type}-${id}`)
    : [];

export type CandidateRow = MovieCacheRow & { similarity?: number };

// Filters movie_cache for the spin wheel. Without a query embedding the
// candidates are random; with one they are the closest matches by meaning.
export const queryWheelCandidates = async (
  { genres = [], type = 'both', fromYear, toYear, exclude = [] }: WheelFilters,
  { limit, queryEmbedding }: { limit: number; queryEmbedding?: number[] | null },
): Promise<CandidateRow[]> => {
  const filters: string[] = [];
  const values: unknown[] = [];

  if (Array.isArray(genres) && genres.length > 0) {
    values.push(genres.map((genre) => String(genre).toLowerCase()));
    filters.push(`
      EXISTS (
        SELECT 1
        FROM unnest($${values.length}::text[]) AS requested_genre
        WHERE lower(mc.genre) LIKE '%' || requested_genre || '%'
      )
    `);
  }

  if (type === 'movie' || type === 'tv') {
    values.push(type);
    filters.push(`mc.type = $${values.length}`);
  }

  if (fromYear) {
    values.push(Number(fromYear));
    filters.push(
      `NULLIF(substring(mc.year from '\\d{4}'), '')::int >= $${values.length}`,
    );
  }

  if (toYear) {
    values.push(Number(toYear));
    filters.push(
      `NULLIF(substring(mc.year from '\\d{4}'), '')::int <= $${values.length}`,
    );
  }

  const excludeKeys = titleKeys(exclude);
  if (excludeKeys.length > 0) {
    values.push(excludeKeys);
    filters.push(
      `(mc.media_type || '-' || mc.tmdb_id) != ALL($${values.length}::text[])`,
    );
  }

  let similarity = '';
  let orderBy = 'RANDOM()';
  if (queryEmbedding) {
    values.push(toSqlVector(queryEmbedding));
    const vectorParam = `$${values.length}::vector`;
    filters.push('mc.embedding IS NOT NULL');
    // <=> is cosine distance; similarity = 1 - distance.
    similarity = `, 1 - (mc.embedding <=> ${vectorParam}) AS similarity`;
    orderBy = `mc.embedding <=> ${vectorParam}`;
  }

  values.push(limit);

  const result = await pool.query(
    `
      SELECT mc.tmdb_id, mc.media_type, mc.details, mc.title, mc.year,
             mc.genre, mc.type, mc.director, mc.actors, mc.plot${similarity}
      FROM movie_cache mc
      ${filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''}
      ORDER BY ${orderBy}
      LIMIT $${values.length}
    `,
    values,
  );

  return result.rows;
};
