import { describe, expect, it } from 'vitest';
import {
  buildTasteProfile,
  scoreMovie,
  weightedSample,
} from '../services/tasteProfile';

// Deterministic stand-in for Math.random.
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('buildTasteProfile', () => {
  it('weights favourites above watched above watch later', () => {
    const profile = buildTasteProfile([
      { list: 'favourite', genre: 'Thriller' },
      { list: 'watched', genre: 'Comedy' },
      { list: 'watch_later', genre: 'Horror' },
    ]);
    expect(profile.genres.get('Thriller')).toBe(3);
    expect(profile.genres.get('Comedy')).toBe(2);
    expect(profile.genres.get('Horror')).toBe(1);
    expect(profile.topGenre).toBe('Thriller');
  });

  it('only counts the three leading actors and ignores N/A', () => {
    const profile = buildTasteProfile([
      { list: 'watched', actors: 'A, B, C, D', director: 'N/A' },
    ]);
    expect([...profile.actors.keys()]).toEqual(['A', 'B', 'C']);
    expect(profile.directors.size).toBe(0);
  });
});

describe('scoreMovie', () => {
  const profile = buildTasteProfile([
    { list: 'favourite', genre: 'Sci-Fi, Thriller', director: 'Christopher Nolan' },
    { list: 'favourite', genre: 'Sci-Fi', director: 'Christopher Nolan', actors: 'Matt Damon' },
    { list: 'watched', genre: 'Drama', actors: 'Matt Damon' },
  ]);

  it('explains a pick by its strongest signal, a shared director first', () => {
    const { score, reason } = scoreMovie(profile, {
      genre: 'Drama',
      director: 'Christopher Nolan',
    });
    expect(reason).toBe('Because you saved 2 films by Christopher Nolan');
    // base 1 + director (3 + 3) x 2 + Drama 2
    expect(score).toBe(15);
  });

  it('calls out the top genre', () => {
    expect(scoreMovie(profile, { genre: 'Sci-Fi' }).reason).toBe(
      'Matches your top genre: Sci-Fi',
    );
  });

  it('mentions a shared lead actor', () => {
    expect(scoreMovie(profile, { actors: 'Matt Damon, Someone Else' }).reason).toBe(
      'Stars Matt Damon, who is in 2 titles you saved',
    );
  });

  it('gives unrelated titles a base score and no reason', () => {
    expect(scoreMovie(profile, { genre: 'Western' })).toMatchObject({
      score: 1,
      reason: null,
    });
  });
});

describe('weightedSample', () => {
  it('picks in proportion to weight', () => {
    // Total 10: [0, 1) → a, [1, 10) → b.
    expect(weightedSample(['a', 'b'], [1, 9], 1, sequence(0.05))).toEqual(['a']);
    expect(weightedSample(['a', 'b'], [1, 9], 1, sequence(0.5))).toEqual(['b']);
  });

  it('draws without replacement', () => {
    const picks = weightedSample(['a', 'b', 'c'], [5, 1, 1], 3, sequence(0, 0, 0));
    expect(picks).toEqual(['a', 'b', 'c']);
  });

  it('returns at most as many items as it has', () => {
    expect(weightedSample(['a', 'b'], [1, 1], 5)).toHaveLength(2);
  });

  it('still draws when every weight is zero', () => {
    expect(weightedSample(['a', 'b'], [0, 0], 1, sequence(0.5))).toHaveLength(1);
  });

  it('heavily weighted items win most draws', () => {
    let seed = 42;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const wins = { a: 0, b: 0 };
    for (let i = 0; i < 1000; i += 1) {
      wins[weightedSample(['a', 'b'] as const, [9, 1], 1, random)[0]] += 1;
    }
    expect(wins.a).toBeGreaterThan(850);
    expect(wins.b).toBeGreaterThan(50);
  });
});
