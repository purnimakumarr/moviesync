// "Smart Spin": scores wheel candidates by how well they match what a user
// has already saved, then draws picks with probability proportional to score.
// Plain weighted counting, so every pick can explain itself.

export type ListName = 'favourite' | 'watched' | 'watch_later';

export type SavedMovie = {
  list: ListName;
  genre?: string | null;
  director?: string | null;
  actors?: string | null;
};

export type ScorableMovie = {
  genre?: string | null;
  director?: string | null;
  actors?: string | null;
};

export type TasteProfile = {
  genres: Map<string, number>;
  directors: Map<string, number>;
  actors: Map<string, number>;
  // How many saved titles mention each director/actor, for the reasons.
  directorCounts: Map<string, number>;
  actorCounts: Map<string, number>;
  topGenre: string | null;
};

// A favourite says more about taste than a title saved for later.
export const LIST_WEIGHTS: Record<ListName, number> = {
  favourite: 3,
  watched: 2,
  watch_later: 1,
};

// Only the leading actors are a meaningful signal.
const ACTORS_CONSIDERED = 3;

const splitField = (value?: string | null, max = Infinity) =>
  (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part !== 'N/A')
    .slice(0, max);

const increment = (map: Map<string, number>, key: string, by: number) =>
  map.set(key, (map.get(key) ?? 0) + by);

export const buildTasteProfile = (saved: SavedMovie[]): TasteProfile => {
  const profile: TasteProfile = {
    genres: new Map(),
    directors: new Map(),
    actors: new Map(),
    directorCounts: new Map(),
    actorCounts: new Map(),
    topGenre: null,
  };

  for (const movie of saved) {
    const weight = LIST_WEIGHTS[movie.list];
    splitField(movie.genre).forEach((genre) => increment(profile.genres, genre, weight));
    splitField(movie.director).forEach((director) => {
      increment(profile.directors, director, weight);
      increment(profile.directorCounts, director, 1);
    });
    splitField(movie.actors, ACTORS_CONSIDERED).forEach((actor) => {
      increment(profile.actors, actor, weight);
      increment(profile.actorCounts, actor, 1);
    });
  }

  let best = 0;
  profile.genres.forEach((weight, genre) => {
    if (weight > best) {
      best = weight;
      profile.topGenre = genre;
    }
  });

  return profile;
};

export type ScoredMovie<T> = { movie: T; score: number; reason: string | null };

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export const scoreMovie = <T extends ScorableMovie>(
  profile: TasteProfile,
  movie: T,
): ScoredMovie<T> => {
  // Every candidate keeps a base chance so the wheel can still surprise.
  let score = 1;
  let bestSignal = 0;
  let reason: string | null = null;

  const consider = (signal: number, text: string) => {
    score += signal;
    if (signal > bestSignal) {
      bestSignal = signal;
      reason = text;
    }
  };

  splitField(movie.director).forEach((director) => {
    const weight = profile.directors.get(director);
    // A shared director is a strong signal, so it counts double.
    if (weight) {
      const count = profile.directorCounts.get(director) ?? 1;
      consider(weight * 2, `Because you saved ${plural(count, 'film')} by ${director}`);
    }
  });

  splitField(movie.actors, ACTORS_CONSIDERED).forEach((actor) => {
    const weight = profile.actors.get(actor);
    if (weight) {
      const count = profile.actorCounts.get(actor) ?? 1;
      consider(weight, `Stars ${actor}, who is in ${plural(count, 'title')} you saved`);
    }
  });

  splitField(movie.genre).forEach((genre) => {
    const weight = profile.genres.get(genre);
    if (weight) {
      consider(
        weight,
        genre === profile.topGenre
          ? `Matches your top genre: ${genre}`
          : `You often save ${genre} titles`,
      );
    }
  });

  return { movie, score, reason };
};

// Draws `count` items without replacement, each draw proportional to weight.
export const weightedSample = <T>(
  items: T[],
  weights: number[],
  count: number,
  random: () => number = Math.random,
): T[] => {
  const pool = items.map((item, index) => ({ item, weight: Math.max(weights[index], 0) }));
  const picks: T[] = [];

  while (picks.length < count && pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let target = random() * total;
    let index = pool.findIndex((entry) => (target -= entry.weight) < 0);
    // All-zero weights or floating point leftovers: fall back to the last item.
    if (index === -1) index = pool.length - 1;
    picks.push(pool[index].item);
    pool.splice(index, 1);
  }

  return picks;
};
