import { Movie } from '../types';
import { getGenres, getStartYear, movieKey } from './tmdb';

// Every genre name TMDB returns for movies and TV, which is what movie_cache
// stores and the backend matches against.
export const WHEEL_GENRES = [
  'Action',
  'Action & Adventure',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Kids',
  'Music',
  'Mystery',
  'News',
  'Reality',
  'Romance',
  'Sci-Fi & Fantasy',
  'Science Fiction',
  'Soap',
  'Talk',
  'Thriller',
  'TV Movie',
  'War',
  'War & Politics',
  'Western',
];

export type ContentTypeFilter = 'both' | 'movie' | 'tv';

export type WheelFilters = {
  genres: string[];
  type: ContentTypeFilter;
  yearRange: [number, number];
  excludeWatched: boolean;
  watchedIds: Set<string>;
};

export const uniqueMovies = (movies: Movie[]) => {
  const byId = new Map<string, Movie>();
  movies.forEach((movie) => byId.set(movieKey(movie), movie));
  return Array.from(byId.values());
};

// Client-side version of the backend wheel filters, used when the API has
// no candidates or is unreachable.
export const filterCandidates = (movies: Movie[], filters: WheelFilters) => {
  const { genres, type, yearRange, excludeWatched, watchedIds } = filters;

  return movies.filter((movie) => {
    const year = getStartYear(movie) ?? 0;
    const movieGenres = getGenres(movie);
    const matchesGenre =
      genres.length === 0 || genres.some((genre) => movieGenres.includes(genre));
    const matchesType = type === 'both' || movie.media_type === type;
    const matchesYear = year >= yearRange[0] && year <= yearRange[1];
    const isAllowed = !excludeWatched || !watchedIds.has(movieKey(movie));

    return matchesGenre && matchesType && matchesYear && isAllowed;
  });
};

// Fisher–Yates shuffle, then take the first `count`.
export const getRandomMovies = <T,>(
  movies: T[],
  count: number,
  random: () => number = Math.random,
): T[] => {
  const shuffled = [...movies];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
};

export type WheelSegment<T> = {
  key: string;
  // null renders a "?" placeholder slice.
  movie: T | null;
};

export const MIN_WHEEL_SEGMENTS = 6;
// More than 8 slices leaves too little room for a readable title and poster.
export const MAX_WHEEL_SEGMENTS = 8;

// Picks always make it onto the wheel; fillers top it up. Positions are
// shuffled, and short lists repeat so the wheel never has 1-2 giant slices.
export const buildWheelSegments = <T extends Movie>(
  picks: T[],
  fillers: T[],
  random: () => number = Math.random,
  max = MAX_WHEEL_SEGMENTS,
): WheelSegment<T>[] => {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const movie of [...picks, ...getRandomMovies(fillers, fillers.length, random)]) {
    if (unique.length >= max) break;
    if (seen.has(movieKey(movie))) continue;
    seen.add(movieKey(movie));
    unique.push(movie);
  }

  const items: (T | null)[] = getRandomMovies(unique, unique.length, random);
  if (items.length === 0) items.push(null);
  for (let i = 0; items.length < MIN_WHEEL_SEGMENTS; i += 1) {
    items.push(items[i % unique.length || 0] ?? null);
  }

  return items.map((movie, index) => ({
    key: `${movie ? movieKey(movie) : 'empty'}-${index}`,
    movie,
  }));
};

// Rotation (degrees, clockwise) that stops segment `index` centred under a
// pointer at the top, always moving forward from `current`.
export const rotationToLand = (
  index: number,
  segmentCount: number,
  current: number,
  extraTurns = 5,
) => {
  const segmentAngle = 360 / segmentCount;
  const segmentCentre = index * segmentAngle + segmentAngle / 2;
  // A wheel point at angle a sits at a + rotation, so we need
  // rotation ≡ -segmentCentre (mod 360).
  const target = (360 - segmentCentre) % 360;
  const currentMod = ((current % 360) + 360) % 360;
  let delta = target - currentMod;
  if (delta <= 0) delta += 360;
  return current + extraTurns * 360 + delta;
};

// Spin wheel filter options and defaults.
export const RECOMMENDATION_OPTIONS = [1, 3, 5, 7, 10] as const;
export type RecommendationCount = (typeof RECOMMENDATION_OPTIONS)[number];

export const MIN_YEAR = 1920;
export const CURRENT_YEAR = new Date().getFullYear();
export const DEFAULT_YEAR_RANGE: [number, number] = [1980, CURRENT_YEAR];

export const countActiveFilters = (
  genres: string[],
  type: ContentTypeFilter,
  yearRange: [number, number],
) =>
  (genres.length > 0 ? 1 : 0) +
  (type !== 'both' ? 1 : 0) +
  (yearRange[0] !== DEFAULT_YEAR_RANGE[0] || yearRange[1] !== DEFAULT_YEAR_RANGE[1] ? 1 : 0);

// Splits a title into at most two lines on word boundaries, with an ellipsis
// only when it really doesn't fit.
export const wrapTitle = (title: string, maxChars = 15, maxLines = 2) => {
  const lines: string[] = [];
  let current = '';
  const words = title.split(/\s+/).filter(Boolean);

  for (let i = 0; i < words.length; i += 1) {
    const candidate = current ? `${current} ${words[i]}` : words[i];
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = words[i];
    if (lines.length === maxLines - 1) {
      const rest = words.slice(i).join(' ');
      current = rest.length > maxChars ? `${rest.slice(0, maxChars - 1).trimEnd()}…` : rest;
      break;
    }
  }
  if (current) lines.push(current);
  return lines.map((line) => (line.length > maxChars ? `${line.slice(0, maxChars - 1)}…` : line));
};
