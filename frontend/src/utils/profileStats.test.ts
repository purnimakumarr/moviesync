import { describe, expect, it } from 'vitest';
import { TmdbMovie, TmdbTv } from '../types';
import { computeProfileStats, formatDuration } from './profileStats';

const genres = (...names: string[]) => names.map((name, id) => ({ id, name }));
const languages = (...names: string[]) => names.map((english_name) => ({ iso_639_1: '', english_name, name: english_name }));
const people = (...names: string[]) => names.map((name, id) => ({ id, name }));

const film = (overrides: Partial<TmdbMovie> & { id: number; title: string }, director: string, cast: string[]): TmdbMovie => ({
  media_type: 'movie',
  poster_path: null,
  vote_count: 1000,
  credits: { cast: people(...cast), crew: [{ id: 0, name: director, job: 'Director', department: 'Directing' }] },
  ...overrides,
});

describe('computeProfileStats', () => {
  const heat = film(
    { id: 1, title: 'Heat', genres: genres('Crime', 'Drama'), spoken_languages: languages('English'), release_date: '1995-12-15', runtime: 170, vote_average: 8.3 },
    'Michael Mann',
    ['Al Pacino', 'Robert De Niro'],
  );
  const collateral = film(
    { id: 2, title: 'Collateral', genres: genres('Crime', 'Thriller'), spoken_languages: languages('English', 'Spanish'), release_date: '2004-08-06', runtime: 120, vote_average: 7.5 },
    'Michael Mann',
    ['Tom Cruise', 'Jamie Foxx'],
  );
  // Shows have creators instead of a director; none listed here.
  const show: TmdbTv = {
    id: 3,
    media_type: 'tv',
    name: 'Breaking Bad',
    poster_path: null,
    genres: genres('Drama'),
    first_air_date: '2008-01-20',
    last_air_date: '2013-09-29',
    episode_run_time: [45],
    number_of_episodes: 62,
    vote_average: 9.5,
    vote_count: 1000,
    spoken_languages: languages('English'),
  };

  const stats = computeProfileStats({ favourites: [heat], watchLater: [collateral], watched: [heat, show] });

  it('counts unique titles across lists', () => {
    expect(stats.savedCount).toBe(3);
    expect(stats.watchedCount).toBe(2);
    expect(stats.watchedMovies).toBe(1);
    expect(stats.watchedShows).toBe(1);
  });

  it('adds up watch time from runtimes and episode counts', () => {
    // 170 min + 45 min × 62 episodes = 2960 min.
    expect(stats.watchTime).toEqual({ days: 2, hours: 1, minutes: 20 });
  });

  it('falls back to the latest episode runtime when a show has no episode_run_time', () => {
    const { watchTime } = computeProfileStats({
      favourites: [],
      watchLater: [],
      watched: [{ ...show, episode_run_time: [], last_episode_to_air: { runtime: 50 }, number_of_episodes: 10 }],
    });
    expect(watchTime).toEqual({ days: 0, hours: 8, minutes: 20 });
  });

  it('averages TMDB ratings of watched titles', () => {
    expect(stats.averageRating).toBe(8.9);
  });

  it('ranks genres, languages and people', () => {
    expect(stats.genres[0]).toEqual({ label: 'Crime', value: 2 });
    expect(stats.genres[0].value).toBeGreaterThanOrEqual(stats.genres[1].value);
    expect(stats.languages[0]).toEqual({ label: 'English', value: 3 });
    expect(stats.directors).toEqual([{ label: 'Michael Mann', value: 2 }]);
  });

  it('lists every decade in range, including empty ones', () => {
    expect(stats.decades).toEqual([
      { label: '1990s', value: 1 },
      { label: '2000s', value: 2 },
    ]);
  });

  it('buckets ratings into bands', () => {
    const bands = Object.fromEntries(stats.ratings.map((band) => [band.label, band.value]));
    expect(bands['7–8']).toBe(1);
    expect(bands['8–9']).toBe(1);
    expect(bands['9+']).toBe(1);
  });

  it('estimates how long the watch-later backlog would take', () => {
    expect(stats.backlogTime).toEqual({ days: 0, hours: 2, minutes: 0 });
  });

  it('reports how much of the to-watch pile is done', () => {
    // 2 watched, 1 still on watch later.
    expect(stats.completionRate).toBe(67);
  });

  it('picks highlights', () => {
    expect(stats.highlights.topGenre).toEqual({ label: 'Crime', value: 2, share: 67 });
    expect(stats.highlights.favouriteDecade).toEqual({ label: '2000s', value: 2 });
    expect(stats.highlights.topDirector).toEqual({ label: 'Michael Mann', value: 2 });
    expect(stats.highlights.highestRated).toEqual({ title: 'Breaking Bad', rating: 9.5 });
    expect(stats.highlights.oldest).toEqual({ title: 'Heat', year: 1995 });
  });

  it('handles empty lists', () => {
    const empty = computeProfileStats({ favourites: [], watchLater: [], watched: [] });
    expect(empty).toMatchObject({ savedCount: 0, averageRating: null, completionRate: null, genres: [], decades: [], ratings: [] });
    expect(Object.values(empty.highlights).every((value) => value === null)).toBe(true);
  });
});

describe('formatDuration', () => {
  it('splits minutes into days, hours and minutes', () => {
    expect(formatDuration(1501)).toEqual({ days: 1, hours: 1, minutes: 1 });
  });
});
