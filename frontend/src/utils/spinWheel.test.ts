import { describe, expect, it } from 'vitest';
import { Movie, TmdbMovie } from '../types';
import {
  buildWheelSegments,
  filterCandidates,
  getRandomMovies,
  MIN_WHEEL_SEGMENTS,
  rotationToLand,
  uniqueMovies,
  WheelFilters,
  wrapTitle,
} from './spinWheel';

const movie = (overrides: Partial<TmdbMovie>): TmdbMovie => ({
  id: 0,
  media_type: 'movie',
  title: 'Untitled',
  release_date: '2000-01-01',
  poster_path: null,
  genres: [{ id: 18, name: 'Drama' }],
  ...overrides,
});

const show = (id: number, genre: string, firstAirDate: string): Movie => ({
  id,
  media_type: 'tv',
  name: `Show ${id}`,
  first_air_date: firstAirDate,
  poster_path: null,
  genres: [{ id: 0, name: genre }],
});

const genres = (...names: string[]) => names.map((name, id) => ({ id, name }));

const noFilters: WheelFilters = {
  genres: [],
  type: 'both',
  yearRange: [1900, 2100],
  excludeWatched: false,
  watchedIds: new Set(),
};

describe('uniqueMovies', () => {
  it('keeps one entry per media type and id', () => {
    const result = uniqueMovies([
      movie({ id: 1 }),
      movie({ id: 2 }),
      movie({ id: 1, title: 'Duplicate' }),
      show(1, 'Drama', '2001-01-01'),
    ]);
    expect(result.map((m) => `${m.media_type}-${m.id}`)).toEqual(['movie-1', 'movie-2', 'tv-1']);
  });
});

describe('filterCandidates', () => {
  const COMEDY_90S = 1;
  const ROMCOM = 2;
  const SERIES = 3;
  const THRILLER = 4;
  const movies = [
    movie({ id: COMEDY_90S, genres: genres('Comedy'), release_date: '1994-05-01' }),
    movie({ id: ROMCOM, genres: genres('Comedy', 'Romance'), release_date: '2015-02-14' }),
    show(SERIES, 'Comedy', '1998-09-01'),
    movie({ id: THRILLER, genres: genres('Thriller'), release_date: '1996-10-01' }),
  ];
  const ids = (filters: Partial<WheelFilters>) =>
    filterCandidates(movies, { ...noFilters, ...filters }).map((m) => m.id);

  it('returns everything with no filters', () => {
    expect(ids({})).toHaveLength(4);
  });

  it('matches any of the selected genres', () => {
    expect(ids({ genres: ['Romance', 'Thriller'] })).toEqual([ROMCOM, THRILLER]);
  });

  it('filters by type and year range', () => {
    expect(ids({ type: 'tv' })).toEqual([SERIES]);
    expect(ids({ yearRange: [1990, 1999] })).toEqual([COMEDY_90S, SERIES, THRILLER]);
  });

  it('excludes watched titles only when asked', () => {
    const watchedIds = new Set([`movie-${COMEDY_90S}`]);
    expect(ids({ watchedIds })).toContain(COMEDY_90S);
    expect(ids({ watchedIds, excludeWatched: true })).not.toContain(COMEDY_90S);
  });
});

describe('getRandomMovies', () => {
  it('returns the requested number of distinct items', () => {
    const picks = getRandomMovies([1, 2, 3, 4, 5], 3);
    expect(picks).toHaveLength(3);
    expect(new Set(picks).size).toBe(3);
  });

  it('never returns more items than it was given', () => {
    expect(getRandomMovies([1, 2], 5)).toHaveLength(2);
  });

  it('is deterministic for a given random source', () => {
    const alwaysZero = () => 0;
    // Each step swaps position i with 0, rotating the array left by one.
    expect(getRandomMovies([1, 2, 3, 4], 4, alwaysZero)).toEqual([2, 3, 4, 1]);
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3];
    getRandomMovies(input, 3);
    expect(input).toEqual([1, 2, 3]);
  });
});

describe('buildWheelSegments', () => {
  // Picks are 1–9, fillers 10 and up.
  const movies = (ids: number[]) => ids.map((id) => movie({ id }));
  const ids = (segments: { movie: Movie | null }[]) => segments.map((s) => s.movie?.id ?? null);

  it('always includes every pick', () => {
    const segments = buildWheelSegments(movies([1, 2]), movies([11, 12, 13, 14, 15, 16]));
    expect(ids(segments)).toEqual(expect.arrayContaining([1, 2]));
  });

  it('caps the wheel and never duplicates titles when there are enough', () => {
    const fillers = movies(Array.from({ length: 20 }, (_, i) => 10 + i));
    const segments = buildWheelSegments(movies([1]), fillers, Math.random, 10);
    expect(segments).toHaveLength(10);
    expect(new Set(ids(segments)).size).toBe(10);
  });

  it('skips fillers that are already picks', () => {
    const segments = buildWheelSegments(movies([1]), movies([1, 11, 12, 13, 14, 15]));
    expect(ids(segments).filter((id) => id === 1)).toHaveLength(1);
  });

  it('repeats a short list up to the minimum size', () => {
    const segments = buildWheelSegments(movies([1, 2]), []);
    expect(segments).toHaveLength(MIN_WHEEL_SEGMENTS);
    expect(new Set(ids(segments))).toEqual(new Set([1, 2]));
    expect(new Set(segments.map((s) => s.key)).size).toBe(MIN_WHEEL_SEGMENTS);
  });

  it('shows placeholders when there is nothing to show', () => {
    const segments = buildWheelSegments([], []);
    expect(segments).toHaveLength(MIN_WHEEL_SEGMENTS);
    expect(ids(segments).every((id) => id === null)).toBe(true);
  });
});

describe('rotationToLand', () => {
  // Which segment sits under the top pointer after rotating by `rotation`.
  const segmentAtPointer = (rotation: number, count: number) => {
    const angleOnWheel = (((-rotation % 360) + 360) % 360);
    return Math.floor(angleOnWheel / (360 / count));
  };

  it('lands every segment under the pointer, from any starting angle', () => {
    for (const count of [6, 8, 10]) {
      for (const start of [0, 37, 359, 1234, -90]) {
        for (let index = 0; index < count; index += 1) {
          const rotation = rotationToLand(index, count, start);
          expect(segmentAtPointer(rotation, count)).toBe(index);
        }
      }
    }
  });

  it('stops in the middle of the segment', () => {
    // 4 segments of 90°: segment 1 spans 90–180°, centre 135° → rotate 225°.
    expect(rotationToLand(1, 4, 0, 0)).toBe(225);
  });

  it('always spins forward by the requested extra turns', () => {
    const rotation = rotationToLand(0, 6, 500, 5);
    expect(rotation - 500).toBeGreaterThan(5 * 360);
    expect(rotation - 500).toBeLessThanOrEqual(6 * 360);
  });
});

describe('wrapTitle', () => {
  it('keeps short titles on one line', () => {
    expect(wrapTitle('Moon')).toEqual(['Moon']);
  });

  it('wraps on word boundaries instead of cutting words', () => {
    expect(wrapTitle('The Shawshank Redemption')).toEqual(['The Shawshank', 'Redemption']);
  });

  it('adds an ellipsis only when two lines are not enough', () => {
    const lines = wrapTitle('Eternal Sunshine of the Spotless Mind');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('Eternal');
    expect(lines[1].endsWith('…')).toBe(true);
    expect(lines.every((line) => line.length <= 15)).toBe(true);
  });

  it('truncates a single very long word', () => {
    expect(wrapTitle('Supercalifragilisticexpialidocious')).toEqual(['Supercalifragi…']);
  });
});
